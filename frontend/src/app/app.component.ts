// IMPORTACION DEL DECORADOR COMPONENT DE ANGULAR
import { Component } from '@angular/core';
// IMPORTACION DEL SERVICIO DE TEMA QUE CENTRALIZA LA LOGICA DE CLARO/OSCURO/AUTO
import { ThemeService } from './services/theme.service';

// METADATOS DEL COMPONENTE RAIZ DE LA APLICACION ARGOS
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN APPMODULE
  standalone: false,
})
export class AppComponent {
  // CONSTRUCTOR QUE INYECTA EL THEMESERVICE — LA SOLA INSTANCIACION DEL SERVICIO
  // ARRANCA SU CONSTRUCTOR Y APLICA EL TEMA PERSISTIDO O EL AUTOMATICO
  constructor(private readonly themeService: ThemeService) {}

  // METODO PUBLICO DE CONVENIENCIA POR COMPATIBILIDAD CON ITERACIONES PREVIAS
  public toggleTheme(): void {
    // DELEGAMOS LA OPERACION AL SERVICIO RESPONSABLE DEL TEMA
    this.themeService.toggleTheme();
  }
}
