# +AFINACIÓN

Plataforma e-commerce para venta de kits de afinación automotriz, con búsqueda por compatibilidad exacta de vehículo (marca, modelo, año, motor).

Demo: [masafinacion.com](https://masafinacion.com)

<!-- ![banner](./screenshots/banner.png) -->

## Qué hace

El catálogo se filtra por compatibilidad vehicular exacta, no por búsqueda genérica de texto. Cada ficha de producto trae especificaciones técnicas completas y SEO por producto (react-helmet-async). El checkout está integrado con Mercado Pago e incluye un upsell de servicio de instalación en taller. La interfaz mantiene un CTA fijo (sidebar en desktop, barra inferior en mobile) para no perder la intención de compra al hacer scroll.

## Stack

Frontend: React, Vite, Framer Motion
Backend: Node.js, Express
Base de datos: MongoDB
Pagos: Mercado Pago API

## El reto técnico

La parte más difícil del proyecto es el motor de filtrado de compatibilidad vehículo-refacción, construido sobre una base de datos de más de 1000 registros extraídos y normalizados de catálogos técnicos de NGK e Interfil/UNIFIL. Cada registro se valida contra un esquema estricto (IDs secuenciales sin huecos, prefijos de SKU preservados exactamente, nombres de modelo normalizados) para que el resultado de búsqueda sea compatible de verdad con el vehículo del usuario, no una aproximación.

## Capturas

| Catálogo | Ficha de producto |
|---|---|
| <img width="1889" height="936" alt="image" src="https://github.com/user-attachments/assets/9ba7ff70-988c-4798-9424-0815c21e2c26" />
 | _(agregar imagen)_ |

| Carrito | Checkout |
|---|---|
| _(agregar imagen)_ | _(agregar imagen)_ |

## Instalación

```bash
git clone https://github.com/DavidSotoo/-Afinacion.git
cd -Afinacion
npm install
cp .env.example .env
npm run dev
```

Variables de entorno requeridas: ver `.env.example` (MongoDB URI, credenciales de Mercado Pago, JWT secret).

## Estado

En desarrollo activo. Actualmente en fase de pulido de la página de producto y el flujo de checkout.
