import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { CreateFinancialRecordRoutePage } from "@/pages/CreateFinancialRecordPage";
import { FinancialRecordDetailsRoutePage } from "@/pages/FinancialRecordDetailsPage";
import { CategoriesRoutePage } from "@/pages/CategoriesPage";
import { PayeesRoutePage } from "@/pages/PayeesPage";
import { SettingsRoutePage } from "@/pages/SettingsPage";
import { WalletsRoutePage } from "@/pages/WalletsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout wide>
              <HomePage />
            </MainLayout>
          }
        />
        <Route
          path="/records/new"
          element={
            <MainLayout>
              <CreateFinancialRecordRoutePage />
            </MainLayout>
          }
        />
        <Route
          path="/records/:id"
          element={
            <MainLayout>
              <FinancialRecordDetailsRoutePage />
            </MainLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <MainLayout>
              <SettingsRoutePage />
            </MainLayout>
          }
        />
        <Route
          path="/settings/wallets"
          element={
            <MainLayout>
              <WalletsRoutePage />
            </MainLayout>
          }
        />
        <Route
          path="/settings/categories"
          element={
            <MainLayout>
              <CategoriesRoutePage />
            </MainLayout>
          }
        />
        <Route
          path="/settings/payees"
          element={
            <MainLayout>
              <PayeesRoutePage />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
