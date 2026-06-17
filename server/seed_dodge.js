const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

const DODGE_VEHICLES = [
  // Atos
  {
    modelo: "Atos",
    anio_inicio: 2001,
    anio_fin: 2004,
    motor: "G4HC",
    litros: 1.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-2510",
    gasolinaSku: "FG-201",
    cabinaSku: null
  },
  {
    modelo: "Atos",
    anio_inicio: 2005,
    anio_fin: 2008,
    motor: "G4HD",
    litros: 1.1,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-2750",
    gasolinaSku: "FG-242",
    cabinaSku: null
  },
  {
    modelo: "Atos",
    anio_inicio: 2009,
    anio_fin: 2012,
    motor: "G4HD",
    litros: 1.1,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-5701",
    gasolinaSku: "FG-242",
    cabinaSku: null
  },
  // Attitude
  {
    modelo: "Attitude",
    anio_inicio: 2006,
    anio_fin: 2011,
    motor: "G4EH",
    litros: 1.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-9688",
    aireSku: "FA-10088",
    gasolinaSku: "FG-242",
    cabinaSku: "FC-10719"
  },
  {
    modelo: "Attitude",
    anio_inicio: 2006,
    anio_fin: 2011,
    motor: "G4ED",
    litros: 1.6,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-9688",
    aireSku: "FA-10088",
    gasolinaSku: "FG-242",
    cabinaSku: "FC-10719"
  },
  {
    modelo: "Attitude",
    anio_inicio: 2012,
    anio_fin: 2014,
    motor: "Gamma",
    litros: 1.6,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZKR6B-10E", codigo: "1578" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 1.0,
    aceiteSku: "FO-9688",
    aireSku: "FA-11206",
    gasolinaSku: "FG-242",
    cabinaSku: "FC-10719"
  },
  {
    modelo: "Attitude",
    anio_inicio: 2015,
    anio_fin: 2018,
    motor: "3A92",
    litros: 1.2,
    cilindros_config: "L3",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5BI-11", codigo: "93298" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-617",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-7850"
  },
  {
    modelo: "Attitude",
    anio_inicio: 2019,
    anio_fin: 2024,
    motor: "3A92",
    litros: 1.2,
    cilindros_config: "L3",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5BI-11", codigo: "93298" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-617",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-7850"
  },
  // Avenger
  {
    modelo: "Avenger",
    anio_inicio: 2008,
    anio_fin: 2014,
    motor: "ED3",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-9054",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  {
    modelo: "Avenger",
    anio_inicio: 2011,
    anio_fin: 2014,
    motor: "ERB",
    litros: 3.6,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "SILZKR7B11", codigo: "9723" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-11665",
    aireSku: "FA-11170",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  // Caliber
  {
    modelo: "Caliber",
    anio_inicio: 2007,
    anio_fin: 2010,
    motor: "ECN",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-10118",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  {
    modelo: "Caliber",
    anio_inicio: 2011,
    anio_fin: 2012,
    motor: "ECN",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11048",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  {
    modelo: "Caliber",
    anio_inicio: 2007,
    anio_fin: 2010,
    motor: "ED3",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-10118",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  {
    modelo: "Caliber",
    anio_inicio: 2011,
    anio_fin: 2012,
    motor: "ED3",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11048",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  // Journey
  {
    modelo: "Journey",
    anio_inicio: 2009,
    anio_fin: 2020,
    motor: "ED3",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR5F-11", codigo: "3886" },
    bujia_iridium_ix: { tipo: "ZFR5FIX-11", codigo: "2477" },
    bujia_g_power: { tipo: "ZFR5FGP", codigo: "7098" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-10516",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  {
    modelo: "Journey",
    anio_inicio: 2011,
    anio_fin: 2019,
    motor: "ERB",
    litros: 3.6,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "SILZKR7B11", codigo: "9723" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-11665",
    aireSku: "FA-11170",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10729"
  },
  // Neon
  {
    modelo: "Neon",
    anio_inicio: 2000,
    anio_fin: 2005,
    motor: "ECB",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR6E-11", codigo: "96326" },
    bujia_iridium_ix: { tipo: "BKR6EIX-11", codigo: "3764" },
    bujia_g_power: { tipo: "BKR6EGP", codigo: "7092" },
    bujia_v_power: { tipo: "BKR6E-11", codigo: "96326" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-3614",
    aireSku: "FA-8805",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Neon",
    anio_inicio: 2017,
    anio_fin: 2020,
    motor: "E-Torq",
    litros: 1.6,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZKAR7D-9D", codigo: "91322" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 0.9,
    aceiteSku: "FO-6818",
    aireSku: "FA-5206",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10413"
  },
  // Dart
  {
    modelo: "Dart",
    anio_inicio: 2013,
    anio_fin: 2016,
    motor: "ECK",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5CI-11", codigo: "92145" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11431",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10374"
  },
  {
    modelo: "Dart",
    anio_inicio: 2013,
    anio_fin: 2016,
    motor: "ED6",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5CI-11", codigo: "92145" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11431",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10374"
  },
  // Dakota
  {
    modelo: "Dakota",
    anio_inicio: 2005,
    anio_fin: 2008,
    motor: "EKG",
    litros: 3.7,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR6F-11G", codigo: "6987" },
    bujia_iridium_ix: { tipo: "ZFR6FIX-11", codigo: "6441" },
    bujia_g_power: { tipo: "ZFR6FGP", codigo: "7100" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-3600",
    aireSku: "FA-3901",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Dakota",
    anio_inicio: 2009,
    anio_fin: 2012,
    motor: "EKG",
    litros: 3.7,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR6F-11G", codigo: "6987" },
    bujia_iridium_ix: { tipo: "ZFR6FIX-11", codigo: "6441" },
    bujia_g_power: { tipo: "ZFR6FGP", codigo: "7100" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10575",
    aireSku: "FA-3901",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  // Durango
  {
    modelo: "Durango",
    anio_inicio: 2011,
    anio_fin: 2015,
    motor: "ERB",
    litros: 3.6,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "SILZKR7B11", codigo: "9723" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-11665",
    aireSku: "FA-10755",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-11183"
  },
  // Ram 1500
  {
    modelo: "Ram 1500",
    anio_inicio: 2002,
    anio_fin: 2008,
    motor: "EKG",
    litros: 3.7,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "ZFR6F-11G", codigo: "6987" },
    bujia_iridium_ix: { tipo: "ZFR6FIX-11", codigo: "6441" },
    bujia_g_power: { tipo: "ZFR6FGP", codigo: "7100" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-3600",
    aireSku: "FA-9401",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Ram 1500",
    anio_inicio: 2003,
    anio_fin: 2008,
    motor: "EZB",
    litros: 5.7,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZTR4A-11", codigo: "94484" },
    bujia_iridium_ix: { tipo: "LZTR4AIX-11", codigo: "2313" },
    bujia_g_power: { tipo: "LZTR4AGP", codigo: "5017" },
    bujia_v_power: { tipo: "LZTR4A-11", codigo: "94484" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-16",
    aireSku: "FA-9401",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Ram 1500",
    anio_inicio: 2009,
    anio_fin: 2012,
    motor: "EZH",
    litros: 5.7,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5C-11", codigo: "94630" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-2",
    aireSku: "FA-9401",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Ram 1500",
    anio_inicio: 2013,
    anio_fin: 2022,
    motor: "EZH",
    litros: 5.7,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5C-11", codigo: "94630" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-9401",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  // Charger
  {
    modelo: "Charger",
    anio_inicio: 2011,
    anio_fin: 2023,
    motor: "ERB",
    litros: 3.6,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "SILZKR7B11", codigo: "9723" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-11665",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Charger",
    anio_inicio: 2015,
    anio_fin: 2023,
    motor: "EZH",
    litros: 5.7,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5CI-11", codigo: "92145" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Charger",
    anio_inicio: 2012,
    anio_fin: 2023,
    motor: "ESG",
    litros: 6.4,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZTR6AP11EG", codigo: "97408" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-2",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  // Challenger
  {
    modelo: "Challenger",
    anio_inicio: 2011,
    anio_fin: 2023,
    motor: "ERB",
    litros: 3.6,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "SILZKR7B11", codigo: "9723" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-11665",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Challenger",
    anio_inicio: 2015,
    anio_fin: 2023,
    motor: "EZH",
    litros: 5.7,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5CI-11", codigo: "92145" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-10060",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  },
  {
    modelo: "Challenger",
    anio_inicio: 2011,
    anio_fin: 2023,
    motor: "ESH",
    litros: 6.4,
    cilindros_config: "V8",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZTR6AP11EG", codigo: "97408" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-2",
    aireSku: "FA-11257",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  }
];

const FILTER_ALTERNATES = {
  // Dodge Air Filters
  'FA-2510': { interfil: 'F-25A10', joe: 'JA2510' },
  'FA-2750': { interfil: 'F-27A50', joe: 'JA2750' },
  'FA-5701': { interfil: 'F-57A01', joe: 'JA5701' },
  'FA-10088': { interfil: 'F-100A88', joe: 'JA10088' },
  'FA-11206': { interfil: 'F-28A00', joe: 'JA2814' },
  'FA-617': { interfil: 'F-101A25', joe: 'JA11617' },
  'FA-9054': { interfil: 'F-90A54', joe: 'JA9054' },
  'FA-11170': { interfil: 'F-100A14', joe: 'JA11170' },
  'FA-10118': { interfil: 'F-16A94', joe: 'JA10118' },
  'FA-11048': { interfil: 'F-10A45', joe: 'JA11048' },
  'FA-10516': { interfil: 'F-19A16', joe: 'JA10516' },
  'FA-8805': { interfil: 'F-88A05', joe: 'JA2000' },
  'FA-5206': { interfil: 'F-52A06', joe: 'JA10520' },
  'FA-11431': { interfil: 'F-114A31', joe: 'JA11431' },
  'FA-3901': { interfil: 'F-39A01', joe: 'JA3901' },
  'FA-10755': { interfil: 'F-107A55', joe: 'JA10755' },
  'FA-9401': { interfil: 'F-24A04', joe: 'JA7141' },
  'FA-11257': { interfil: 'F-112A57', joe: 'JA11257' },

  // Oil Filters
  'FO-6607': { interfil: 'OF-6607' },
  'FO-9688': { interfil: 'OF-9688' },
  'FO-10060': { interfil: 'OF-10060' },
  'FO-11665': { interfil: 'OF-11665' },
  'FO-3614': { interfil: 'OF-3614' },
  'FO-6818': { interfil: 'OF-6818' },
  'FO-3600': { interfil: 'OF-3600' },
  'FO-10575': { interfil: 'OF-10575' },
  'FO-16': { interfil: 'OF-16' },
  'FO-2': { interfil: 'OF-2' },

  // Gasoline Filters
  'FG-201': { interfil: 'FGI-201' },
  'FG-242': { interfil: 'FGI-242' },

  // Cabin Filters
  'FC-10719': { interfil: 'CFI-10719' },
  'FC-7850': { interfil: 'CFI-7850' },
  'FC-10729': { interfil: 'CFI-10729' },
  'FC-10413': { interfil: 'CFI-10413' },
  'FC-10374': { interfil: 'CFI-10374' },
  'FC-11183': { interfil: 'CFI-11183' },
  'FC-10140': { interfil: 'CFI-10140' },
  'FC-10746': { interfil: 'CFI-10746' }
};

function makeFilter(unifilSku, tipo) {
  if (!unifilSku) return null;
  if (unifilSku === 'SELLADO') {
    return {
      tipo,
      sku: 'SELLADO',
      marca: null,
      hasData: true,
      alternos: []
    };
  }

  const alternos = [];
  const altInfo = FILTER_ALTERNATES[unifilSku];
  if (altInfo) {
    if (altInfo.interfil) {
      alternos.push({ marca: 'INTERFIL', sku: altInfo.interfil });
    }
    if (altInfo.joe) {
      alternos.push({ marca: 'JOE', sku: altInfo.joe });
    }
  }

  return {
    tipo,
    sku: unifilSku,
    marca: 'UNIFIL',
    hasData: true,
    alternos
  };
}

function getFilterDescription(brand, sku) {
  const brandClean = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  let type = 'Aire';
  if (sku.startsWith('OF')) type = 'Aceite';
  else if (sku.startsWith('FGI')) type = 'Gasolina';
  else if (sku.startsWith('CFI')) type = 'Cabina';
  return `Filtro de ${type} (${brandClean})`;
}

async function ensureAlternatesInPrecioFiltro() {
  const PrecioFiltro = require('./models/PrecioFiltro');
  const uniqueKeys = new Map();

  for (const [unifilSku, alt] of Object.entries(FILTER_ALTERNATES)) {
    if (alt.interfil) {
      uniqueKeys.set(`INTERFIL_${alt.interfil}`, {
        clave: alt.interfil,
        marca: 'INTERFIL',
        precio: 80.0,
        descripcion: getFilterDescription('INTERFIL', alt.interfil)
      });
    }
    if (alt.joe) {
      uniqueKeys.set(`JOE_${alt.joe}`, {
        clave: alt.joe,
        marca: 'JOE',
        precio: 80.0,
        descripcion: getFilterDescription('JOE', alt.joe)
      });
    }
  }

  console.log(`⏳ Verificando ${uniqueKeys.size} claves de filtros alternos en la colección preciounifils...`);
  const bulkOps = [];
  
  for (const [key, filterData] of uniqueKeys.entries()) {
    const exists = await PrecioFiltro.findOne({
      marca: filterData.marca,
      clave: filterData.clave
    });
    if (!exists) {
      bulkOps.push({
        insertOne: {
          document: filterData
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    console.log(`   └─ Insertando ${bulkOps.length} nuevos filtros alternos en la base de datos...`);
    await PrecioFiltro.bulkWrite(bulkOps);
    console.log(`   └─ Filtros alternos insertados con éxito.`);
  } else {
    console.log(`   └─ Todos los filtros alternos ya existen en preciounifils.`);
  }
}

async function seed() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para sincronizar la marca Dodge...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida.');

    await ensureAlternatesInPrecioFiltro();

    console.log('⏳ Limpiando registros anteriores de Dodge...');
    const deleteRes = await Vehiculo.deleteMany({ marca: /^dodge$/i });
    console.log(`   └─ Eliminados ${deleteRes.deletedCount} vehículos Dodge antiguos.`);

    const recordsToInsert = DODGE_VEHICLES.map(v => {
      return {
        marca: "Dodge",
        modelo: v.modelo,
        anio_inicio: v.anio_inicio,
        anio_fin: v.anio_fin,
        motor: v.motor,
        litros: v.litros,
        cilindros_config: v.cilindros_config,
        aspiracion: v.aspiracion,
        bujia_stock: v.bujia_stock,
        bujia_iridium_ix: v.bujia_iridium_ix,
        bujia_g_power: v.bujia_g_power,
        bujia_v_power: v.bujia_v_power,
        calibracion_mm: v.calibracion_mm,
        filtros_unifil: {
          filtro_aire: v.aireSku || null,
          filtro_aceite: v.aceiteSku || null,
          filtro_gasolina: v.gasolinaSku === 'SELLADO' ? null : (v.gasolinaSku || null),
          filtro_cabina: v.cabinaSku || null
        },
        referencias_alternas: {
          filtro_aire_joe: FILTER_ALTERNATES[v.aireSku]?.joe || null,
          filtro_aceite_joe: FILTER_ALTERNATES[v.aceiteSku]?.joe || null,
          filtro_gasolina_joe: FILTER_ALTERNATES[v.gasolinaSku]?.joe || null,
          filtro_cabina_joe: FILTER_ALTERNATES[v.cabinaSku]?.joe || null
        },
        kit_afinacion: {
          filtro_aceite: makeFilter(v.aceiteSku, "Intercambiable / Cartucho"),
          filtro_aire: makeFilter(v.aireSku, "Panel / Cilíndrico"),
          filtro_gasolina: makeFilter(v.gasolinaSku, "Línea"),
          filtro_cabina: makeFilter(v.cabinaSku, "Polen")
        }
      };
    });

    console.log(`⏳ Insertando ${recordsToInsert.length} vehículos Dodge nuevos en MongoDB Atlas...`);
    const insertRes = await Vehiculo.insertMany(recordsToInsert);
    console.log(`🎉 Inserción completada con éxito. Insertados ${insertRes.length} vehículos.`);

  } catch (err) {
    console.error('❌ Error durante el seed de Dodge:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión con MongoDB cerrada.');
    process.exit(0);
  }
}

seed();

