import { Injectable } from '@angular/core';
import { getAuth,Auth, onAuthStateChanged , RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, GoogleAuthProvider,getIdTokenResult  } from '@angular/fire/auth';
import { signInWithCustomToken } from 'firebase/auth';
import { AjaxUtilService } from './ajax-util.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})

export class FirebaseService {

  private recaptchaVerifier: RecaptchaVerifier | null = null; 
  private _isAuthenticated: boolean = false;
  private userCredentials: any;
  private isValidating: boolean = false;

  constructor(private auth: Auth,private AJAXUtil : AjaxUtilService,private cookies: LocalStorageService) {
    this.checkAuthState();
  }

  //A getter function to check whether the user is authenticated or not
  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  signInWithCustomToken(customToken: string) {
    this.isValidating =true;
    console.log("starting signing in")
    signInWithCustomToken(this.auth , customToken)
      .then((userCredential) => {
        console.log('User signed in successfully:');
      })
      .catch((error) => {
        console.error('Error signing in:', error);
      });
  }

   //setUpRecaptcha for the login process...
   setupRecaptcha(containerId: string) {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible', 
    });
  }

  private checkAuthState() {
    onAuthStateChanged(this.auth, (user) => {
      this._isAuthenticated = false; 
      if (user) {
        this.updateUserInfo(user);
        return user;
      }
      return null;
    });
  }
  
  async updateUserInfo(user: any) {
    this.isValidating = true;
  
    try {

        this.AJAXUtil.ajax("api/json/action/getUserInfo", {}).subscribe((jsonData)=>{
        if (jsonData.status === "success") {
          this.userCredentials = this.buildCredentials(jsonData, user);
          this._isAuthenticated = true;
        } else {
          user?.email!=null && this.handleUserFallback(user);
        }
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      await user?.email!=null && this.handleUserFallback(user);
    } finally {
      this.isValidating = false;
    }
  }
  
  private buildCredentials(jsonData: any, user: any) {
    return {
      acc_type: jsonData.role,
      name: jsonData.fname || user?.displayName,
      lname: jsonData.lname,
      photoURL: jsonData.profile_pic || user?.photoURL,
      picId : jsonData.profile_pic_id,
      phoneNumber: jsonData.mobile || user?.phoneNumber,
      email: jsonData.mail || user?.email, 
      city: jsonData.city,
      state: jsonData.state,
      pincode: jsonData.pincode,
      account_id: jsonData.account_id,
    };
  }
  
  private async handleUserFallback(user: any) {
    this.isValidating = true;
    const fallbackCredentials = {
      name: user?.displayName,
      photoURL: user?.photoURL,
      phoneNumber: user?.phoneNumber,
      email: user?.email,
      uid: user?.uid,
    };
  
    try {
      const jsonData = await this.checkAndUpdateUser({
        name: user?.displayName,
        mail: user?.email,
        user_id: user?.uid,
      });
  
      if (jsonData.status === "success") {
        this._isAuthenticated = true;
      }
    } catch (error) {
      console.error("Error in fallback user handling:", error);
    } finally {
      this.userCredentials = fallbackCredentials;
      this.isValidating = false;
    }
  }
  

  //Used for mobile based authentication using signInWithPhoneNumber function in firebase
  async signInWithPhoneNumber(phoneNumber: string): Promise<any> {
    console.log("Trying to sign in with phone number");
    try {
      const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier!); // Use non-null assertion
      console.log("Code sent successfully");
      return confirmationResult;
    } catch (error) {
      console.error('Error during signInWithPhoneNumber:', error);
      throw error;
    }
  }

  //Used to verify the user otp with the firbase 
  async verifyOtp(confirmationResult: any, otp: string): Promise<any> {
    console.log("Trying to verify the OTP");
    try {
      const userCredential = await confirmationResult.confirm(otp);
      return userCredential.user;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  //authenticate with the google with gooleAuthProvider
  async googleSignIn(): Promise<any> {
    this.isValidating = true;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const accessToken = credential?.accessToken;
      if(user)
        return this.checkAndUpdateUser({"name": user?.displayName, "mail" : user?.email, "user_id": user?.uid})
      else 
        throw new Error("User not found during sign-in.");
    } catch (error) {
      console.error('Error during sign-in:', error);
      throw error; 
    }
  }

  async checkAndUpdateUser(params: any): Promise<any>
  {
    return new Promise((resolve, reject) => 
    {
      this.AJAXUtil.ajax("api/json/action/checkAndUpdateUser",params).subscribe((jsonData) => {
          if (jsonData) {
            resolve(jsonData);
          }
        }, (error) => {
          reject(error);
        });
    });
  }
  
  // Logout
  signOut() { 
    this.cookies.removeItem("jwtToken");
    return this.auth.signOut();
  }

  //Getter Functions
  get userFName(){
    return  this.hasValidCredentials() ? this.userCredentials['name'] : null;
  }

  get userLName()
  {
    return  this.hasValidCredentials() ? this.userCredentials['lname'] : null;
  }

  get userMail()
  {
    return  this.hasValidCredentials() ? this.userCredentials['email'] : null;
  }

  get userMobile()
  {
    return  this.hasValidCredentials() ? this.userCredentials['phoneNumber'] : null;
  }

  get userPicture() {
    return  this.hasValidCredentials() ? this.userCredentials['photoURL'] : null;
  }

  get userPictureId() {
    return  this.hasValidCredentials() ? this.userCredentials['picId'] : null;
  }

  get userPincode()
  {
    return  this.hasValidCredentials() ? this.userCredentials['pincode'] : null;
  }

  get userCity()
  {
    return this.hasValidCredentials() ? this.userCredentials["city"] : null;
  }

  get userState()
  {
    return this.hasValidCredentials() ? this.userCredentials["state"] : null;
  }

  get userType()
  {
    return this.hasValidCredentials() ? this.userCredentials["acc_type"] : null;
  }

  hasValidCredentials():boolean{
    if ((!this.isValidating) && this.userCredentials) {
      return true;
    }
    return false;
  }

  async getUserCredential(cretdentail: string):Promise<any>
  { 
    if (this.hasValidCredentials()) {
      return this.userCredentials[cretdentail];
    }
  
    const waitForCredentials = (): Promise<any> => {
      return new Promise((resolve) => {

        var interval=setInterval(() => { 
            if(this.hasValidCredentials())
            {
              clearInterval(interval);
              resolve(this.userCredentials[cretdentail])
            }
        }, 1000);

      });
    };
  
    return await waitForCredentials();
  }
}
