import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  login,
  getDashboardStats,
  getExpenses,
  createExpense,
  getDonations,
  createDonation,
  getCampaigns,
  createCampaign,
  getDonors,
  createDonor,
  getBeneficiaries,
  createBeneficiary,
  exportExpenses,
} from "../controllers/index.js";

const router = express.Router();

// Auth
router.post("/auth/login", login);

// Dashboard
router.get("/dashboard/stats", authenticateToken, getDashboardStats);

// Expenses
router.get("/expenses", authenticateToken, getExpenses);
router.post("/expenses", authenticateToken, createExpense);

// Donations
router.get("/donations", authenticateToken, getDonations);
router.post("/donations", authenticateToken, createDonation);

// Campaigns
router.get("/campaigns", authenticateToken, getCampaigns);
router.post("/campaigns", authenticateToken, createCampaign);

// Donors
router.get("/donors", authenticateToken, getDonors);
router.post("/donors", authenticateToken, createDonor);

// Beneficiaries
router.get("/beneficiaries", authenticateToken, getBeneficiaries);
router.post("/beneficiaries", authenticateToken, createBeneficiary);

// Export
router.get("/export/expenses", authenticateToken, exportExpenses);

export default router;
