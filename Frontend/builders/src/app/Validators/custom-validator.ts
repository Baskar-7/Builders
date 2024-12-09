import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidator {

    static minchars(minChars: number) : ValidatorFn
    {
        return (control : AbstractControl) : ValidationErrors | null =>{
            if(!control.value) return null;
            const charCount  = control.value.trim().replace(/\s+/).length; 
            return charCount < minChars ? { minWords: { required: minChars, actual: charCount } } : null
        };
    }
    static maxchars(maxChars: number) : ValidatorFn
    {
        return (control : AbstractControl) : ValidationErrors | null =>{
            if(!control.value) return null;
            const charCount  = control.value.trim().replace(/\s+/).length
            return charCount > maxChars ? { minWords: { required: maxChars, actual: charCount } } : null
        };
    }
}
