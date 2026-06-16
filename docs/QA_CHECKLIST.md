# QA Checklist

## V.6.4c.RF13 -- Mobile Safe Overview Renderer

### Implementacion

- [x] se agrego `.admin-orders-mobile-overview`
- [x] mobile renderer reutiliza la barra realtime
- [x] mobile renderer muestra `Jornada actual`
- [x] mobile renderer muestra `Operacion en vivo`
- [x] mobile renderer muestra `Insights`
- [x] el overview viejo queda intacto para desktop
- [x] el overview viejo se oculta solo en mobile
- [x] no se tocaron metricas
- [x] no se toco realtime
- [x] no se tocaron calculos
- [x] no se toco `components/admin/admin-shell.css`
- [x] no se tocaron metricas
- [x] no se toco realtime
- [x] no se toco hydration
- [x] no se tocaron sessions
- [x] no se tocaron pedidos
- [x] no se tocaron modales
- [x] no se toco drawer
- [x] `V.6.4c.2` sigue pausada

### QA pendiente

- [ ] `320px`: renderer mobile visible
- [ ] `390px`: renderer mobile visible
- [ ] `768px`: renderer mobile visible
- [ ] `1024px`: renderer desktop intacto
- [ ] mobile emulado: sin overflow
- [ ] mobile emulado: overview completo visible
- [ ] execution intacto
- [ ] cards de pedidos intactas
- [ ] Android Chrome real: overview nuevo visible
- [ ] Android Chrome real: desaparecen bandas horizontales corruptas
- [ ] Android Chrome real: desaparecen tiles flotantes
- [ ] Android Chrome real: scroll lento y fling rapido sin degradacion
- [ ] Opera Mini: sanity check sigue sano
- [ ] desktop sanity check
- [ ] `V.6.4c.2` sigue pausada

### Validacion tecnica

- [x] `npm.cmd exec tsc -- --noEmit`
- [ ] `npm.cmd run lint` pendiente de setup interactivo
