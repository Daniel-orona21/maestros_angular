import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { PaginaErrorComponent } from './componentes/pages/pagina-error/pagina-error.component';
import { ResetPasswordComponent } from './componentes/reset-password/reset-password.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { 
        path: 'inicio', 
        component: InicioComponent,
        canActivate: [authGuard]
    },
   
    { path: 'error', component: PaginaErrorComponent },
    { path: '**', component: PaginaErrorComponent}
];