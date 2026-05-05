// IMPORTACION DEL ARRANCADOR DINAMICO DE ANGULAR PARA NAVEGADOR
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// IMPORTACION DEL REGISTRADOR DE WEB COMPONENTS DE SWIPER (BUNDLE COMPLETO)
import { register as registerSwiperElements } from 'swiper/element/bundle';

// REGISTRO GLOBAL DE LOS CUSTOM ELEMENTS DE PHOSPHOR ICONS (TODA LA LIBRERIA)
import '@phosphor-icons/webcomponents';

// IMPORTACION DEL MODULO RAIZ DE LA APLICACION ARGOS
import { AppModule } from './app/app.module';

// REGISTRO GLOBAL DE LOS CUSTOM ELEMENTS DE SWIPER ANTES DEL BOOTSTRAP
registerSwiperElements();

// ARRANQUE DE LA APLICACION ANGULAR DESDE EL MODULO RAIZ
platformBrowserDynamic().bootstrapModule(AppModule)
  // CAPTURA Y LOG DE CUALQUIER ERROR DURANTE EL BOOTSTRAP
  .catch(err => console.log(err));
