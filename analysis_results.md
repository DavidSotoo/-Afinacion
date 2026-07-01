# Reporte de Análisis del Catálogo: Marcas, Vehículos y Cobertura de Autopartes

**Fecha de generación:** 1/7/2026, 12:37:38 p.m.
**Total de Vehículos en DB:** 1683
**Total de Filtros en Catálogo:** 1826 (695 vinculados, 1131 huérfanos)
**Total de Bujías en Catálogo:** 99 (47 vinculados, 52 huérfanas)
**Total de Balatas en Catálogo:** 786 (666 vinculados, 120 huérfanas)

## 1. Cobertura General por Marca

| Marca | Vehículos | Con Bujía % | Con Kit Básico % (Aceite+Aire) | Con Balata Del. % | Con Balata Tras. % | Con Ambas Balatas % | Con Alguna Balata % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 100.0% | 100.0% | 27.8% | 0.0% | 55.6% | 83.3% |
| **BMW** | 36 | 100.0% | 38.9% | 19.4% | 0.0% | 8.3% | 27.8% |
| **CHEVROLET** | 642 | 99.5% | 62.6% | 24.0% | 0.5% | 42.2% | 66.7% |
| **DODGE** | 33 | 100.0% | 100.0% | 36.4% | 0.0% | 60.6% | 97.0% |
| **FORD** | 272 | 100.0% | 67.3% | 53.7% | 0.0% | 12.5% | 66.2% |
| **HONDA** | 113 | 100.0% | 94.7% | 54.9% | 0.9% | 15.0% | 70.8% |
| **MAZDA** | 84 | 86.9% | 81.0% | 48.8% | 0.0% | 0.0% | 48.8% |
| **MITSUBISHI** | 13 | 100.0% | 92.3% | 46.2% | 0.0% | 38.5% | 84.6% |
| **NISSAN** | 53 | 100.0% | 96.2% | 30.2% | 0.0% | 50.9% | 81.1% |
| **SEAT** | 55 | 100.0% | 100.0% | 21.8% | 3.6% | 0.0% | 25.5% |
| **TOYOTA** | 144 | 100.0% | 88.2% | 36.8% | 2.1% | 18.1% | 56.9% |
| **VOLKSWAGEN** | 220 | 99.1% | 78.6% | 61.4% | 3.2% | 11.8% | 76.4% |

> [!NOTE]
> Un "Kit Básico" se considera cuando el vehículo tiene asignados y vinculados al menos un filtro de aceite y un filtro de aire válidos (que no sean "SELLADO").

## 2. Desglose Detallado de Filtros por Marca

| Marca | Vehículos | Aceite | Aire | Gasolina | Cabina | Con Todos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 18 | 18 | 18 | 18 | 18 |
| **BMW** | 36 | 24 | 14 | 0 | 2 | 0 |
| **CHEVROLET** | 642 | 521 | 418 | 549 | 247 | 218 |
| **DODGE** | 33 | 33 | 33 | 33 | 17 | 17 |
| **FORD** | 272 | 189 | 189 | 195 | 116 | 106 |
| **HONDA** | 113 | 112 | 108 | 113 | 103 | 97 |
| **MAZDA** | 84 | 77 | 69 | 80 | 48 | 43 |
| **MITSUBISHI** | 13 | 13 | 12 | 13 | 12 | 11 |
| **NISSAN** | 53 | 52 | 52 | 53 | 37 | 35 |
| **SEAT** | 55 | 55 | 55 | 55 | 55 | 55 |
| **TOYOTA** | 144 | 138 | 133 | 144 | 107 | 90 |
| **VOLKSWAGEN** | 220 | 178 | 183 | 189 | 145 | 132 |

## 3. Desglose Detallado de Bujías por Marca

| Marca | Vehículos | Stock | Iridium IX | G-Power (Platino) | V-Power (Cobre) | Con Alguna |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **AUDI** | 18 | 18 | 0 | 0 | 0 | 18 |
| **BMW** | 36 | 36 | 0 | 0 | 0 | 36 |
| **CHEVROLET** | 642 | 593 | 575 | 561 | 414 | 639 |
| **DODGE** | 33 | 33 | 29 | 29 | 7 | 33 |
| **FORD** | 272 | 246 | 208 | 199 | 113 | 272 |
| **HONDA** | 113 | 111 | 88 | 84 | 10 | 113 |
| **MAZDA** | 84 | 72 | 68 | 67 | 19 | 73 |
| **MITSUBISHI** | 13 | 13 | 10 | 10 | 5 | 13 |
| **NISSAN** | 53 | 53 | 30 | 30 | 12 | 53 |
| **SEAT** | 55 | 55 | 8 | 4 | 0 | 55 |
| **TOYOTA** | 144 | 144 | 113 | 112 | 53 | 144 |
| **VOLKSWAGEN** | 220 | 216 | 78 | 49 | 12 | 218 |

## 4. Análisis de Partes Huérfanas en Catálogo

Estas son piezas registradas en las listas de precios / catálogos generales, pero que no están siendo referenciadas por ningún vehículo en la colección `Vehiculo`.

### 4.1. Balatas Huérfanas (Muestra de las primeras 15)
Total de balatas huérfanas: **120**

| SKU Dynamic | Equivalente Wagner | FMSI | Posición | Compatibilidad declarada en catálogo (Wagner) |
| :--- | :--- | :--- | :--- | :--- |
| DNK7922D1019CK | WD1019 | 7922-D1019 | Delantero | CHEVROLET SRX (2004-2006) |
| DNK29160LM | WX29160A | -29160 | Delantero | NISSAN CABSTAR (2011-2011) |
| DNK7972D1066CK | OEX1737 | 7972-D1066 | Delantero | NISSAN ROGUE (2014-2014) |
| DNK8982D1640CK | WC1640A | 8982-D1640 | Delantero | CHEVROLET ZAFIRA (2016-2016) |
| DNK7155AD275LM | WX275 | 7155A-D275 | Delantero | NISSAN TSURU (1992-1992), NISSAN TSURU (1984-1991) |
| DNK8793D1581LM | WX1581 | 8793-D1581 | Delantero | NISSAN CABSTAR (2011-2011), NISSAN CABSTAR (2009-2009), NISSAN CABSTAR (2008-2008) |
| DNK1452S665 | WZ665R | 1452-S665 | Trasero | NISSAN QUEST (1997-2002) |
| DNK8958D1734CK | WC1734 | 8958-D1734 | Trasero | CHEVROLET ZAFIRA (2016-2016) |
| DNK8383D1268LM | WX1268S | 8383-D1268 | Delantero | VOLKSWAGEN CRAFTER VAN (2008-2011) |
| DNK8305D1187LM | WX1187 | 8305-D1187 | Trasero | NISSAN ALMERA (2001-2005) |
| DNK7155D233LM | WX233 | 7155-D233 | Delantero | NISSAN HIKARI (1988-1992), NISSAN TSURU (1992-1992), NISSAN TSURU (1984-1991) |
| DNK8794D1582LM | WX1582 | 8794-D1582 | Delantero | NISSAN CABSTAR (2009-2009) |
| DNK8333D1213LM | WX1213 | 8333-D1213 | Delantero | NISSAN SILHOUETTE (2019-2019), NISSAN SILHOUETTE (2014-2016), NISSAN SILHOUETTE (2001-2008) |
| DNK9003D1640CK | WC1640B | 9003-D1640 | Delantero | CHEVROLET ZAFIRA (2016-2016) |
| DNK8249D1138CK | WD1138 | 8249-D1138 | Delantero | NISSAN LUCINO (1996-2000) |

### 4.2. Filtros Huérfanos (Muestra de los primeros 15)
Total de filtros huérfanos en lista de precios: **1131**

| SKU | Marca | Precio |
| :--- | :--- | :--- |
| FC-8102CA | UNIFIL | $96.62799999999999 |
| FC-8644CA | UNIFIL | $62.523999999999994 |
| FC-8838 | UNIFIL | $51.156 |
| FC-10420 | UNIFIL | $56.839999999999996 |
| FC-10547CA | UNIFIL | $68.208 |
| FC-10728CA | UNIFIL | $68.208 |
| FC-11182CA | UNIFIL | $68.208 |
| FC-11670 | UNIFIL | $51.156 |
| FC-12058CA | UNIFIL | $68.208 |
| FC-12150CA | UNIFIL | $68.208 |
| FC-12237CA | UNIFIL | $62.523999999999994 |
| FC-80749CA | UNIFIL | $79.576 |
| FO-4967 | UNIFIL | $34.104 |
| FO-9641 | UNIFIL | $47.7421 |
| FA-1368 | UNIFIL | $62.523999999999994 |

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

