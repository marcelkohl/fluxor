#!/usr/bin/env node
/**
 * Gera ícones SVG no catálogo plano src/assets/icons/.
 * Pula arquivos que já existem (compatibilidade).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "../src/assets/icons");

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">';
const SVG_CLOSE = "</svg>";

/** @type {Record<string, { path?: string; paths?: string[]; circles?: string[]; rects?: string[]; lines?: string[] }>} */
const ICONS = {
  // ── Carteiras ──
  walletBank: {
    paths: [
      "M3 21h18",
      "M5 21V7l8-4v18",
      "M19 21V11l-6-3",
      "M9 9v0",
      "M9 12v0",
      "M9 15v0",
      "M9 18v0",
    ],
  },
  walletCreditCard: {
    paths: ["M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z", "M2 12h20"],
  },
  walletPiggyBank: {
    paths: [
      "M19 11c0-3.87-3.13-7-7-7S5 7.13 5 11s3.13 7 7 7 7-3.13 7-7z",
      "M12 4V2",
      "M8 14h.01",
      "M16 14h.01",
      "M9 18c1 1 2.5 1.5 3 1.5s2-.5 3-1.5",
    ],
  },
  walletCash: {
    paths: [
      "M4 7h16v10H4z",
      "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    ],
  },
  walletSafe: {
    paths: [
      "M4 6h16v14H4z",
      "M8 6V4h8v2",
      "M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
      "M12 13v3",
    ],
  },
  walletInvestment: {
    paths: ["M3 3v18h18", "M7 16l4-4 4 4 5-6"],
  },
  walletStocks: {
    paths: ["M3 3v18h18", "M7 16v-5", "M12 16v-8", "M17 16v-3"],
  },
  walletCrypto: {
    paths: [
      "M12 2l8 4.5v7L12 18l-8-4.5v-7L12 2z",
      "M9.5 9.5h3a1.5 1.5 0 1 1 0 3h-3v-3z",
      "M12 9.5v3",
    ],
  },
  walletBriefcase: {
    paths: [
      "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M4 7h16v12H4z",
      "M4 12h16",
    ],
  },
  walletHome: {
    paths: ["M3 11l9-7 9 7", "M5 10v10h14V10"],
  },
  walletCar: {
    paths: [
      "M5 17h14",
      "M5 17a2 2 0 1 0-4 0",
      "M19 17a2 2 0 1 0-4 0",
      "M3 11l2-5h14l2 5",
      "M5 11h14",
    ],
  },
  walletTravel: {
    paths: [
      "M17 8h2a2 2 0 0 1 2 2v1H3V10a2 2 0 0 1 2-2h2",
      "M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M6 11v8",
      "M18 11v8",
      "M12 11v8",
    ],
  },
  walletBusiness: {
    paths: [
      "M3 21h18",
      "M6 21V5l6-2 6 2v16",
      "M10 9h.01",
      "M10 13h.01",
      "M10 17h.01",
      "M14 9h.01",
      "M14 13h.01",
      "M14 17h.01",
    ],
  },

  // ── Categorias — Receitas ──
  categorySalary: {
    paths: [
      "M12 2v20",
      "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    ],
  },
  categoryBonus: { paths: ["M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 2z"] },
  categoryCommission: {
    paths: ["M12 2v4", "M12 18v4", "M4.93 4.93l2.83 2.83", "M16.24 16.24l2.83 2.83", "M2 12h4", "M18 12h4", "M4.93 19.07l2.83-2.83", "M16.24 7.76l2.83-2.83"],
  },
  categoryDividend: { paths: ["M12 2v20", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", "M3 3l18 18"] },
  categoryRentIncome: {
    paths: ["M3 11l9-7 9 7", "M5 10v10h14V10", "M12 14v4", "M10 16h4"],
  },
  categoryInvestmentReturn: { paths: ["M3 3v18h18", "M7 14l4-4 4 4 5-8"] },
  categoryGift: {
    paths: [
      "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8",
      "M4 12h16",
      "M12 22V12",
      "M12 12H7.5a2.5 2.5 0 0 1 0-5C11 7 12 12 12 12z",
      "M12 12h4.5a2.5 2.5 0 0 0 0-5C13 7 12 12 12 12z",
    ],
  },
  categoryRefund: {
    paths: ["M3 12a9 9 0 1 0 9-9", "M3 3v6h6", "M12 8v8", "M8 12h8"],
  },
  categorySale: {
    paths: ["M6 6h15l-1.5 9H7.5L6 6z", "M9 18a2 2 0 1 0 0-4", "M17 18a2 2 0 1 0 0-4", "M3 3l3 3"],
  },

  // ── Moradia ──
  categoryHome: { paths: ["M3 11l9-7 9 7", "M5 10v10h14V10"] },
  categoryApartment: {
    paths: ["M3 21h18", "M6 21V5l6-2 6 2v16", "M10 9h.01", "M10 13h.01", "M14 9h.01", "M14 13h.01"],
  },
  categoryHouse: { paths: ["M3 10.5L12 3l9 7.5V21H3z", "M9 21v-6h6v6"] },
  categoryRent: { paths: ["M3 11l9-7 9 7", "M5 10v10h14V10", "M8 14h8"] },
  categoryCondominium: {
    paths: ["M3 21h18", "M5 21V7l7-3 7 3v14", "M9 9h.01", "M9 12h.01", "M9 15h.01", "M15 9h.01", "M15 12h.01", "M15 15h.01"],
  },
  categoryMortgage: {
    paths: ["M3 11l9-7 9 7", "M5 10v10h14V10", "M12 14v4", "M8 16h8"],
  },
  categoryFurniture: {
    paths: ["M4 10h16v10H4z", "M4 14h16", "M8 10V7h8v3"],
  },
  categoryMaintenance: {
    paths: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"],
  },
  categoryCleaning: {
    paths: ["M12 3v3", "M6 9h12", "M8 9l-1 12h10L16 9", "M10 13h4"],
  },

  // ── Alimentação ──
  categoryRestaurant: {
    paths: ["M3 11h10v10H3z", "M7 11V3", "M5 3v4", "M9 3v4", "M17 11v10", "M17 7V3", "M15 3v8", "M19 3v8"],
  },
  categoryFastFood: {
    paths: ["M4 14h16", "M6 14l1-8h10l1 8", "M8 18a1 1 0 1 0 0-2", "M16 18a1 1 0 1 0 0-2"],
  },
  categoryCoffee: {
    paths: ["M17 8h1a4 4 0 0 1 0 8h-1", "M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z", "M6 2v2", "M10 2v2", "M14 2v2"],
  },
  categoryShoppingCart: {
    paths: ["M6 6h15l-1.5 9H7.5L6 6z", "M9 20a1 1 0 1 0 0-2", "M18 20a1 1 0 1 0 0-2"],
  },
  categoryMarket: {
    paths: ["M3 9l3-6h12l3 6", "M5 9v11h14V9", "M9 14h6"],
  },
  categoryBakery: {
    paths: ["M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4H9c-1-1-2-2-2-4a5 5 0 0 1 5-5z", "M8 15h8v5H8z"],
  },
  categoryDrink: {
    paths: ["M8 2h8l-1 9a4 4 0 0 1-6 0L8 2z", "M12 15v7"],
  },

  // ── Transporte ──
  categoryCar: {
    paths: ["M5 17h14", "M5 17a2 2 0 1 0-4 0", "M19 17a2 2 0 1 0-4 0", "M3 11l2-5h14l2 5", "M5 11h14"],
  },
  categoryFuel: {
    paths: ["M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18", "M3 10h12", "M19 6v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8l-4-2"],
  },
  categoryParking: { paths: ["M4 4h16v16H4z", "M9 17V7h4a3 3 0 0 1 0 6H9"] },
  categoryTaxi: {
    paths: ["M5 17h14", "M5 17a2 2 0 1 0-4 0", "M19 17a2 2 0 1 0-4 0", "M3 11l2-5h14l2 5", "M8 7h8"],
  },
  categoryBus: {
    paths: ["M4 6h16v12H4z", "M4 12h16", "M6 18a1 1 0 1 0 0-2", "M18 18a1 1 0 1 0 0-2", "M8 6V4", "M16 6V4"],
  },
  categoryTrain: {
    paths: ["M4 15h16", "M4 15a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v6z", "M8 19l-2 3", "M16 19l2 3", "M12 9v4"],
  },
  categoryAirplane: { paths: ["M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"] },
  categoryMotorcycle: {
    paths: ["M5 17a2 2 0 1 0 0-4", "M19 17a2 2 0 1 0 0-4", "M5 15h3l2-5h5l2 5h2", "M10 10l2-3h2"],
  },
  categoryBike: {
    paths: ["M5 18a3 3 0 1 0 0-6", "M19 18a3 3 0 1 0 0-6", "M5 15h3l3-6 4 3 3 3h2", "M14 9l-2-3"],
  },
  categoryRoad: { paths: ["M4 19l4-14", "M12 19l4-14", "M20 19l-4-14", "M4 15h16"] },

  // ── Saúde ──
  categoryHeart: { paths: ["M12 21s-6.5-4.35-9-7.5C1.5 11 2 7.5 5 6c2-1.2 4 .5 5 2 1-1.5 3-3.2 5-2 3 1.5 3.5 5 2 7.5-2.5 3.15-9 7.5-9 7.5z"] },
  categoryHospital: {
    paths: ["M3 21h18", "M6 21V5l6-2 6 2v16", "M12 10v6", "M9 13h6"],
  },
  categoryDoctor: {
    paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M18 8v6", "M15 11h6"],
  },
  categoryDentist: {
    paths: ["M12 2c2 2 4 2 6 0 2 4 2 8-1 10-2 2-4 2-5 0-1 2-3 2-5 0-3-2-3-6-1-10 2-2 4-2 6 0z"],
  },
  categoryMedicine: {
    paths: ["M10.5 20.5L3 13l7.5-7.5L17 12l-6.5 8.5z", "M14 6l4 4"],
  },
  categoryFitness: { paths: ["M6 4v16", "M18 4v16", "M6 12h12", "M3 8h3", "M18 8h3", "M3 16h3", "M18 16h3"] },
  categoryGym: { paths: ["M6 4v16", "M18 4v16", "M6 12h12", "M2 8h4", "M18 8h4", "M2 16h4", "M18 16h4"] },
  categoryInsurance: {
    paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  },

  // ── Utilidades ──
  categoryElectricity: { paths: ["M13 2 3 14h8l-1 8 10-12h-8l1-8z"] },
  categoryWater: {
    paths: ["M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"],
  },
  categoryInternet: {
    paths: ["M5 12.55a11 11 0 0 1 14.08 0", "M1.42 9a16 16 0 0 1 21.16 0", "M8.53 16.11a6 6 0 0 1 6.95 0", "M12 20h.01"],
  },
  categoryPhone: {
    paths: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"],
  },
  categoryTv: {
    paths: ["M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z", "M12 18h.01"],
  },
  categoryCloud: {
    paths: ["M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"],
  },

  // ── Educação ──
  categoryBook: {
    paths: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  },
  categorySchool: {
    paths: ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"],
  },
  categoryGraduation: {
    paths: ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c3 2 9 2 12 0v-5"],
  },
  categoryCourse: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5"],
  },
  categoryLanguage: {
    paths: ["M5 8h14", "M12 3c-4 6-4 12 0 18", "M4 12h16", "M20 8c-4 6-4 12 0 18"],
  },
  categoryCertificate: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M10 14l2 2 4-4"],
  },

  // ── Lazer ──
  categoryGame: {
    paths: ["M6 12h4", "M8 10v4", "M15 11h.01", "M18 13h.01", "M17 16a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"],
  },
  categoryMusic: {
    paths: ["M9 18V5l12-2v13", "M9 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M21 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  },
  categoryMovie: {
    paths: ["M4 4h16v16H4z", "M8 4v16", "M16 4v16", "M4 12h16"],
  },
  categoryCamera: {
    paths: ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  },
  categoryBeach: {
    paths: ["M2 20h20", "M4 16c2-2 6-2 8 0s6 2 8 0", "M12 4v4", "M10 6h4"],
  },
  categoryParty: {
    paths: ["M5 8l7-5 7 5v11H5z", "M9 13h6", "M12 8v5", "M4 4l2 2", "M20 4l-2 2"],
  },
  categoryTicket: {
    paths: ["M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V9z", "M13 6v12"],
  },

  // ── Compras ──
  categoryShopping: {
    paths: ["M6 6h15l-1.5 9H7.5L6 6z", "M9 20a1 1 0 1 0 0-2", "M18 20a1 1 0 1 0 0-2"],
  },
  categoryBag: {
    paths: ["M6 6h15l-1.5 9H7.5L6 6z", "M9 6V4a3 3 0 0 1 6 0v2"],
  },
  categoryClothes: {
    paths: ["M16 4l-4-2-4 2", "M4 8l8 4 8-4", "M4 8v10l8 4 8-4V8"],
  },
  categoryWatch: {
    paths: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 4V2", "M12 22v-2", "M16 6h2", "M6 6H4"],
  },
  categoryJewelry: {
    paths: ["M12 2l3 6h6l-5 5 2 9-6-4-6 4 2-9-5-5h6l3-6z"],
  },

  // ── Trabalho ──
  categoryWork: {
    paths: ["M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M4 7h16v12H4z", "M4 12h16"],
  },
  categoryOffice: {
    paths: ["M3 21h18", "M6 21V5l6-2 6 2v16", "M10 9h.01", "M14 9h.01", "M10 13h.01", "M14 13h.01"],
  },
  categoryComputer: {
    paths: ["M4 4h16v12H4z", "M8 20h8", "M12 16v4"],
  },
  categoryLaptop: {
    paths: ["M4 6h16v10H4z", "M2 18h20"],
  },
  categoryMeeting: {
    paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 11a3 3 0 1 0-6 0", "M19 14v3", "M16 16h6"],
  },
  categoryProject: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h6", "M8 9h2"],
  },
  categoryTools: {
    paths: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"],
  },

  // ── Pessoas / Favorecidos ──
  peopleFamily: {
    paths: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  peopleBaby: {
    paths: ["M9 12h.01", "M15 12h.01", "M10 16c.5.5 1.5 1 2 1s1.5-.5 2-1", "M12 2a8 8 0 0 0-8 8v4a8 8 0 0 0 16 0v-4a8 8 0 0 0-8-8z"],
  },
  peopleChildren: {
    paths: ["M9 12h.01", "M15 12h.01", "M10 16h4", "M12 3a7 7 0 0 0-7 7v5h14v-5a7 7 0 0 0-7-7z"],
  },
  peoplePet: {
    paths: ["M10 5a2 2 0 1 0 0-4", "M14 5a2 2 0 1 0 0-4", "M6 9a2 2 0 1 0 0-4", "M18 9a2 2 0 1 0 0-4", "M12 21c4 0 7-3 7-7 0-2-1-3-2-4H7c-1 1-2 2-2 4 0 4 3 7 7 7z"],
  },
  peopleRelationship: {
    paths: ["M12 21s-6.5-4.35-9-7.5C1.5 11 2 7.5 5 6c2-1.2 4 .5 5 2 1-1.5 3-3.2 5-2 3 1.5 3.5 5 2 7.5-2.5 3.15-9 7.5-9 7.5z", "M16 3l2 2"],
  },
  peopleCompany: {
    paths: ["M3 21h18", "M6 21V5l6-2 6 2v16", "M10 9h.01", "M14 9h.01", "M10 13h.01", "M14 13h.01"],
  },
  peopleStore: {
    paths: ["M3 9l3-6h12l3 6", "M5 9v11h14V9", "M9 14h6"],
  },
  peopleProvider: {
    paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M20 8v6", "M23 11h-6"],
  },

  // ── Financeiro ──
  financeMoney: { paths: ["M12 2v20", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"] },
  financeCoins: {
    paths: ["M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0z", "M16 11a4 4 0 1 0 8 0 4 4 0 0 0-8 0z", "M8 15h8"],
  },
  financeLoan: {
    paths: ["M12 2v20", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", "M3 21l18-18"],
  },
  financeTax: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5", "M16 13h.01"],
  },
  financeInvoice: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h6"],
  },
  financeReceipt: {
    paths: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2z", "M8 7h8", "M8 11h8", "M8 15h5"],
  },
  financeCalculator: {
    paths: ["M4 4h16v16H4z", "M8 8h.01", "M12 8h.01", "M16 8h.01", "M8 12h.01", "M12 12h.01", "M16 12h.01", "M8 16h8"],
  },
  financeChart: { paths: ["M3 3v18h18", "M7 16v-5", "M12 16v-8", "M17 16v-3"] },
  financeTrendUp: { paths: ["M3 17l6-6 4 4 8-8", "M14 7h7v7"] },
  financeTrendDown: { paths: ["M3 7l6 6 4-4 8 8", "M14 17h7v-7"] },
  financeShield: { paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"] },
  financeProtection: {
    paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"],
  },
  financeGold: {
    paths: ["M12 2l3 6h6l-5 5 2 9-6-4-6 4 2-9-5-5h6l3-6z"],
  },
  financeFund: {
    paths: ["M3 3v18h18", "M7 14l4-4 4 4 5-8", "M12 8v8"],
  },

  // ── Transferências ──
  transferSwap: { paths: ["M16 3h5v5", "M4 20L21 3", "M21 16v5h-5", "M15 15l6 6", "M4 4l5 5"] },
  transferArrowLeftRight: { paths: ["M8 3 4 7l4 4", "M4 7h16", "M16 21l4-4-4-4", "M20 17H4"] },
  transferSend: { paths: ["M22 2 11 13", "M22 2l-7 20-4-9-9-4 20-7z"] },
  transferReceive: { paths: ["M22 2 11 13", "M22 2l-7 20-4-9-9-4 20-7z", "M2 22h20"] },
  transferExchange: { paths: ["M7 16V4M7 4 3 8l4 4", "M17 8v12m0 0 4-4-4-4"] },

  // ── Documentos ──
  documentFile: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  },
  documentGeneric: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h6"],
  },
  documentPdf: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M10 12h4", "M10 16h4"],
  },
  documentAttachment: {
    paths: ["M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"],
  },
  documentFolder: { paths: ["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"] },
  documentArchive: {
    paths: ["M21 8v13H3V8", "M1 3h22v5H1z", "M10 12h4"],
  },

  // ── Sistema ──
  systemTheme: {
    paths: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  },
  systemDatabase: {
    paths: ["M12 2C8 2 4 3 4 6v12c0 3 4 4 8 4s8-1 8-4V6c0-3-4-4-8-4z", "M4 6c0 3 4 4 8 4s8-1 8-4", "M4 12c0 3 4 4 8 4s8-1 8-4"],
  },
  systemServer: {
    paths: ["M4 4h16v6H4z", "M4 14h16v6H4z", "M8 7h.01", "M8 17h.01"],
  },
  systemSync: {
    paths: ["M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", "M16 16h5v5"],
  },
  systemCloud: {
    paths: ["M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"],
  },
  systemSearch: {
    paths: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  },
  systemReport: {
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h6", "M8 9h4"],
  },
};

function toSvg(def) {
  const parts = [];
  if (def.path) parts.push(`  <path d="${def.path}"/>`);
  if (def.paths) def.paths.forEach((p) => parts.push(`  <path d="${p}"/>`));
  if (def.circles) def.circles.forEach((c) => parts.push(`  <circle ${c}/>`));
  if (def.rects) def.rects.forEach((r) => parts.push(`  <rect ${r}/>`));
  if (def.lines) def.lines.forEach((l) => parts.push(`  <line ${l}/>`));
  return `${SVG_OPEN}\n${parts.join("\n")}\n${SVG_CLOSE}\n`;
}

let created = 0;
let skipped = 0;

for (const [name, def] of Object.entries(ICONS)) {
  const filePath = path.join(ICONS_DIR, `${name}.svg`);
  if (fs.existsSync(filePath)) {
    skipped++;
    continue;
  }
  fs.writeFileSync(filePath, toSvg(def));
  created++;
}

console.log(`Ícones: ${created} criados, ${skipped} já existiam (mantidos).`);
console.log(`Total em ${ICONS_DIR}: ${fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith(".svg")).length}`);
