// IMPORTACION DEL ARRANCADOR DINAMICO DE ANGULAR PARA NAVEGADOR
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// IMPORTACION DEL REGISTRADOR DE WEB COMPONENTS DE SWIPER (BUNDLE COMPLETO)
import { register as registerSwiperElements } from 'swiper/element/bundle';

// REGISTRO GLOBAL DE LOS CUSTOM ELEMENTS DE PHOSPHOR ICONS (TODA LA LIBRERIA)
import '@phosphor-icons/webcomponents';

// IONIC 7+ REQUIERE REGISTRAR EXPLICITAMENTE LOS IONICONS QUE USAN
// COMPONENTES NATIVOS COMO ion-back-button, ion-tab-button O ion-button.
// SIN ESTO IONIC INTENTA HACER UN IMPORT DINAMICO QUE DEVUELVE EL OBJETO
// MODULO ENTERO Y CAUSA createElementNS('[object Object]') EN STENCIL.
import { addIcons } from 'ionicons';
import {
  chevronBack, chevronForward, chevronDown, chevronUp,
  close, closeCircle, ellipsisHorizontal, ellipsisVertical,
  arrowBack, arrowForward, menuOutline, searchOutline,
  checkmarkCircle, alertCircle, refreshCircle, reorderThreeOutline,
} from 'ionicons/icons';

// IMPORTACION DEL MODULO RAIZ DE LA APLICACION ARGOS
import { AppModule } from './app/app.module';

// REGISTRO DE LOS IONICONS USADOS POR LOS COMPONENTES NATIVOS DE IONIC
// SE REGISTRAN CON LOS NOMBRES KEBAB-CASE QUE EL CORE DE IONIC ESPERA
addIcons({
  'chevron-back': chevronBack,
  'chevron-forward': chevronForward,
  'chevron-down': chevronDown,
  'chevron-up': chevronUp,
  'close': close,
  'close-circle': closeCircle,
  'ellipsis-horizontal': ellipsisHorizontal,
  'ellipsis-vertical': ellipsisVertical,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
  'menu-outline': menuOutline,
  'search-outline': searchOutline,
  'checkmark-circle': checkmarkCircle,
  'alert-circle': alertCircle,
  'refresh-circle': refreshCircle,
  'reorder-three-outline': reorderThreeOutline,
});

// REGISTRO GLOBAL DE LOS CUSTOM ELEMENTS DE SWIPER ANTES DEL BOOTSTRAP
registerSwiperElements();

// ARRANQUE DE LA APLICACION ANGULAR DESDE EL MODULO RAIZ
platformBrowserDynamic().bootstrapModule(AppModule)
  // CAPTURA Y LOG DE CUALQUIER ERROR DURANTE EL BOOTSTRAP
  .catch(err => console.log(err));
