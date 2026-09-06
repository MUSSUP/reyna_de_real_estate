# Pruebas

`npm test` · `npm run test:watch`

Corren con **vitest** sobre una **base Postgres de verdad**: `tests/base-efimera.ts`
levanta PGlite —Postgres compilado a WebAssembly— y le aplica las migraciones
reales antes de cada prueba.

No se simula la base. Lo que se prueba es el SQL que va a producción, con sus
restricciones, valores por defecto y tipos. Ya valió la pena: la primera corrida
falló porque `properties.construction_status` es `NOT NULL`, algo que una base
simulada habría dejado pasar.

## Qué se prueba, y por qué eso

`backend/consultas.test.ts` — el formulario de consulta (UJ-06).

Que el formulario ande cuando todo funciona se ve a simple vista. Lo que hay que
sostener con pruebas son los caminos que **nunca ocurren en una demostración** y
donde una consulta se puede perder sin que nadie se entere:

- el proveedor de correo devuelve error, o revienta
- no hay mail de destino configurado
- llega un robot y cae en la trampa
- alguien manda el sexto envío en diez minutos
- el slug de la propiedad no existe
- el mensaje trae HTML

Las dependencias que no se pueden provocar a voluntad —la base y el correo— se
reciben como parámetro en `procesarConsulta`. Por eso cada uno de esos casos se
prueba de verdad, sin depender de que Resend responda.

## Estructura

```
tests/
├── base-efimera.ts      Postgres en memoria con las migraciones aplicadas
└── backend/             Pruebas de la lógica del servidor
```
