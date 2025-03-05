import { Routes, provideRouter } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { PaginaErrorComponent } from './componentes/pages/pagina-error/pagina-error.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'inicio', component: InicioComponent },
    { path: 'error', component: PaginaErrorComponent },
    { path: '**', component: PaginaErrorComponent}
    ];