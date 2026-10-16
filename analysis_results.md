# Reporte de Análisis del Catálogo: Marcas, Vehículos y Cobertura de Autopartes

**Fecha de generación:** 16/10/2026, 10:31:00 a.m.
**Total de Vehículos en DB:** 1683
**Total de Filtros en Catálogo:** 1826 (709 vinculados, 1117 huérfanos)
**Total de Bujías en Catálogo:** 99 (47 vinculados, 52 huérfanas)
**Total de Balatas en Catálogo:** 786 (666 vinculados, 120 huérfanas)

## 1. Cobertura General por Marca

| Marca | Vehículos | Con Bujía % | Con Kit Básico % (Aceite+Aire) | Con Balata Del. % | Con Balata Tras. % | Con Ambas Balatas % | Con Alguna Balata % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 100.0% | 100.0% | 27.8% | 0.0% | 55.6% | 83.3% |
| **BMW** | 36 | 100.0% | 100.0% | 19.4% | 0.0% | 8.3% | 27.8% |
| **CHEVROLET** | 642 | 99.5% | 71.0% | 24.0% | 0.5% | 42.2% | 66.7% |
| **DODGE** | 33 | 100.0% | 100.0% | 36.4% | 0.0% | 60.6% | 97.0% |
| **FORD** | 272 | 100.0% | 85.7% | 53.7% | 0.0% | 12.5% | 66.2% |
| **HONDA** | 113 | 100.0% | 94.7% | 54.9% | 0.9% | 15.0% | 70.8% |
| **MAZDA** | 84 | 89.3% | 86.9% | 48.8% | 0.0% | 0.0% | 48.8% |
| **MITSUBISHI** | 13 | 100.0% | 92.3% | 46.2% | 0.0% | 38.5% | 84.6% |
| **NISSAN** | 53 | 100.0% | 98.1% | 30.2% | 0.0% | 50.9% | 81.1% |
| **SEAT** | 55 | 100.0% | 100.0% | 21.8% | 3.6% | 0.0% | 25.5% |
| **TOYOTA** | 144 | 100.0% | 88.2% | 36.8% | 2.1% | 18.1% | 56.9% |
| **VOLKSWAGEN** | 220 | 99.5% | 84.5% | 61.4% | 3.2% | 11.8% | 76.4% |

> [!NOTE]
> Un "Kit Básico" se considera cuando el vehículo tiene asignados y vinculados al menos un filtro de aceite y un filtro de aire válidos (que no sean "SELLADO").

## 2. Desglose Detallado de Filtros por Marca

| Marca | Vehículos | Aceite | Aire | Gasolina | Cabina | Con Todos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 18 | 18 | 18 | 18 | 18 |
| **BMW** | 36 | 36 | 36 | 36 | 36 | 36 |
| **CHEVROLET** | 642 | 557 | 472 | 575 | 287 | 252 |
| **DODGE** | 33 | 33 | 33 | 33 | 20 | 20 |
| **FORD** | 272 | 240 | 241 | 242 | 134 | 122 |
| **HONDA** | 113 | 112 | 108 | 113 | 104 | 98 |
| **MAZDA** | 84 | 78 | 74 | 80 | 52 | 48 |
| **MITSUBISHI** | 13 | 13 | 12 | 13 | 12 | 11 |
| **NISSAN** | 53 | 53 | 52 | 53 | 44 | 43 |
| **SEAT** | 55 | 55 | 55 | 55 | 55 | 55 |
| **TOYOTA** | 144 | 138 | 133 | 144 | 115 | 98 |
| **VOLKSWAGEN** | 220 | 190 | 191 | 194 | 172 | 165 |

## 3. Desglose Detallado de Bujías por Marca

| Marca | Vehículos | Stock | Iridium IX | G-Power (Platino) | V-Power (Cobre) | Con Alguna |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 18 | 0 | 0 | 0 | 18 |
| **BMW** | 36 | 36 | 0 | 0 | 0 | 36 |
| **CHEVROLET** | 642 | 605 | 580 | 568 | 419 | 639 |
| **DODGE** | 33 | 33 | 29 | 29 | 7 | 33 |
| **FORD** | 272 | 250 | 209 | 202 | 117 | 272 |
| **HONDA** | 113 | 113 | 91 | 88 | 10 | 113 |
| **MAZDA** | 84 | 74 | 71 | 70 | 19 | 75 |
| **MITSUBISHI** | 13 | 13 | 10 | 10 | 5 | 13 |
| **NISSAN** | 53 | 53 | 31 | 31 | 12 | 53 |
| **SEAT** | 55 | 55 | 8 | 4 | 0 | 55 |
| **TOYOTA** | 144 | 144 | 114 | 113 | 56 | 144 |
| **VOLKSWAGEN** | 220 | 217 | 85 | 51 | 13 | 219 |

## 4. Análisis de Partes Huérfanas en Catálogo

Estas son piezas registradas en las listas de precios / catálogos generales, pero que no están siendo referenciadas por ningún vehículo en la colección `Vehiculo`.

### 4.1. Balatas Huérfanas (Muestra de las primeras 15)
Total de balatas huérfanas: **120**

| SKU Dynamic | Equivalente Wagner | FMSI | Posición | Compatibilidad declarada en catálogo (Wagner) |
| :--- | :--- | :--- | :--- | :--- |
| DNK8537D1422CK | WC1422 | 8537-D1422 | Delantero | CHEVROLET SRX (2013-2016), CHEVROLET SRX (2011-2012), CHEVROLET SRX (2010-2010) |
| DNK7923D1019ALM | WX1019A | 7923-D1019A | Delantero | CHEVROLET SRX (2004-2006) |
| DNK7924D1020CK | WD1020 | 7924-D1020 | Trasero | CHEVROLET SRX (2004-2006) |
| DNK7922D1019CK | WD1019 | 7922-D1019 | Delantero | CHEVROLET SRX (2004-2006) |
| DNK728D52CK | WD52 | 728-D52 | Delantero | CHEVROLET CAPRICE (1979-1982), CHEVROLET MALIBU (1975-1975), CHEVROLET NOVA (1975-1978)... |
| DNK7081RD149 | WZ449R | 7081R-D149 | Trasero | CHEVROLET C35 (1983-1986) |
| DNK9003D1640CK | WC1640B | 9003-D1640 | Delantero | CHEVROLET ZAFIRA (2016-2016) |
| DNK8958D1734CK | WC1734 | 8958-D1734 | Trasero | CHEVROLET ZAFIRA (2016-2016) |
| DNK8982D1640CK | WC1640A | 8982-D1640 | Delantero | CHEVROLET ZAFIRA (2016-2016) |
| DNK8257D1147LM | WX1147 | 8257-D1147 | Delantero | NISSAN ALMERA (2001-2005) |
| DNK8305D1187LM | WX1187 | 8305-D1187 | Trasero | NISSAN ALMERA (2001-2005) |
| DNK8256D1146LM | WX1146 | 8256-D1146 | Delantero | NISSAN APRIO (2008-2009), NISSAN PLATINA (2002-2010) |
| DNK8256D1146CK | WC1146 | 8256-D1146 | Delantero | NISSAN APRIO (2008-2009), NISSAN PLATINA (2002-2010) |
| DNK7155D233LM | WX233 | 7155-D233 | Delantero | NISSAN HIKARI (1988-1992), NISSAN TSURU (1992-1992), NISSAN TSURU (1984-1991) |
| DNK7155D233CK | WD233 | 7155-D233 | Delantero | NISSAN HIKARI (1988-1992), NISSAN TSURU (1984-1991) |

### 4.2. Filtros Huérfanos (Muestra de los primeros 15)
Total de filtros huérfanos en lista de precios: **1117**

| SKU | Marca | Precio |
| :--- | :--- | :--- |
| FC-1055CA | UNIFIL | $73.89 |
| FC-1055 | UNIFIL | $56.84 |
| FC-1354CA | UNIFIL | $73.89 |
| FC-1354 | UNIFIL | $56.84 |
| FC-1508CA | UNIFIL | $68.21 |
| FC-1508 | UNIFIL | $51.16 |
| FC-1829CA | UNIFIL | $62.52 |
| FC-1829 | UNIFIL | $45.47 |
| FC-1974CA | UNIFIL | $73.89 |
| FC-1974 | UNIFIL | $56.84 |
| FC-2058CA | UNIFIL | $102.31 |
| FC-2264 | UNIFIL | $92.08 |
| FC-2264CA | UNIFIL | $109.13 |
| FC-2400CA | UNIFIL | $85.26 |
| FC-2545CA | UNIFIL | $68.21 |

### 4.3. Bujías Huérfanas (Muestra de las primeras 15)
Total de bujías huérfanas en lista de precios: **52**

| SKU / Código | Descripción | Precio Cliente |
| :--- | :--- | :--- |
| BCPR5EGP | BUJIA NGK GPWR DO RAM4000 5.9L | $64.06 |
| BCPR5ES11 | BUJIA NGK NISS SENTRA 1.6L 89- | $39.72 |
| BKR5EKB11 | BUJIA NGK TOY 4RUNNER 3.4L 02- | $104.4 |
| BKUR5ET | BUJIA NGK VW EUROVAN 2.5L 01-0 | $105.27 |
| BKUR6ET | BUJIA NGK VW PASSAT 2.0L 91-92 | $105.27 |
| BP6ES | BUJIA NGK BMW MOTORCYCLE R80 7 | $37.68 |
| BP6HS10 | BUJIA NGK MOT FUERA BORDA MARI | $46.49 |
| BPR5EIX11 | BUJIA NGK IRI CHEV LUV 2.2L 99 | $158.47 |
| BPR6EFS | BUJIA NGK JAGUAR STYPE 01-05 | $38.47 |
| BR6FS | BUJIA NGK MERCRUISER 5.7 EFI | $49.85 |
| BR6HSA | BUJIA NGK GENERADR POLARIS P13 | $49.85 |
| CMR6H | BUJIA NGK MOTOSIERRA JONSERED | $172.72 |
| CR6HSA | BUJIA NGK SUZUK LTZ50QUADSPORT | $51.72 |
| CR7E | BUJIA NGK KAWASAKI TERYX750LE | $118.8 |
| CR8EH9 | BUJIA NGK HONDA MOTO XR250 01- | $172.72 |

## 5. Conclusiones y Brechas de Vinculación Detectadas

1. **Bujías:** Excelente cobertura global. La mayoría de las marcas tienen bujías asignadas para casi el 100% de sus vehículos, a excepción de algunos vehículos muy nuevos (ej. modelos 2024+ como Ford Bronco 2.3L, Edge 2L o Chevrolet Tracker 1.2L) donde aún no hay datos de bujías en las listas.
2. **Filtros:** Hay marcas con cobertura del 100% (Nissan, Honda, Toyota, Seat, Dodge) y otras como **BMW** con **0% de cobertura de filtros** (36 vehículos sin ningún filtro). Esto indica que no se han cargado o vinculado catálogos de filtros de BMW a la base de datos de vehículos.
3. **Balatas:** La cobertura de balatas es muy variable. En algunas marcas es nula o baja debido a que los nombres de los vehículos en la base de datos de `Vehiculo` (que provienen de bujías/filtros NGK) difieren de los nombres en el catálogo de balatas (que proviene de Wagner). El `modelNormalizer.js` ayuda a salvar esta brecha pero sigue habiendo balatas huérfanas y vehículos sin balatas asociadas.

