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

| Catálogo |
|---|
| <img width="1889" height="936" alt="image" src="https://github.com/user-attachments/assets/9ba7ff70-988c-4798-9424-0815c21e2c26" />

| Ficha de producto | 
|---|
| <img width="1885" height="927" alt="image" src="https://github.com/user-attachments/assets/916fd4ab-14b7-4536-92b6-8c95a38b89b4" />


| Carrito |
|---|
| <img width="1895" height="944" alt="image" src="https://github.com/user-attachments/assets/4f040a61-8b97-46a7-a2a7-31f58b6a3b4e" />

| Checkout |
|---|
 | <img width="1885" height="942" alt="image" src="https://github.com/user-attachments/assets/c24b6c2e-75db-4f87-b698-4c8895a93a76" />

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
