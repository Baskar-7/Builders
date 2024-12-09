import { Routes, RouterLink } from '@angular/router';
import { onlineCheckGuard } from './guards/online-check.guard'; 
import { NetworkErrorComponent } from './components/utils/network-error/network-error.component';
import { UndefinedUrlComponent } from './components/utils/undefined-url/undefined-url.component';
import { ProfileDetailsComponent } from './components/profile/child-components/profile-details/profile-details.component';
import { AddProjectsComponent } from './components/profile/child-components/add-projects/add-projects.component';
import { ProjectDetailsComponent } from './components/project-details/project-details.component';
import { PopUpServiceComponent } from './components/utils/pop-up-service/pop-up-service.component';
import { ProfileComponent } from './components/profile/profile.component';
import { networkErrorGuard } from './guards/network-error.guard';

import { authCheckGuard } from './guards/auth-check.guard';
import { ManageDetailsComponent } from './components/profile/child-components/manage-details/manage-details.component';
import { adminCheckGuard } from './guards/admin-check.guard';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
    {path : '', redirectTo: '/home', pathMatch: 'full' },
    {path : 'popUp' , component: PopUpServiceComponent},
    { path : 'profile' , component: ProfileComponent, canActivate: [authCheckGuard],
        children: [
            { path: 'profile-details', component: ProfileDetailsComponent },
            { path: 'add-project' , component : AddProjectsComponent, canActivate: [adminCheckGuard]  },
            { path: 'manage-details' , component : ManageDetailsComponent, canActivate: [adminCheckGuard]  },
        ]
    },
    {path: 'project-details', component : ProjectDetailsComponent},
    {path : 'home', component: HomeComponent ,canActivate: [onlineCheckGuard] },
    {path : 'network-error', component: NetworkErrorComponent ,canActivate: [networkErrorGuard]},
    {path : 'undefined-url', component: UndefinedUrlComponent, canActivate: [onlineCheckGuard] },
    {path : '**' , redirectTo: '/undefined-url'},
];
