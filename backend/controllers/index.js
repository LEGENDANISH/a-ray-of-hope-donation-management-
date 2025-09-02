import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import ExcelJS from "exceljs";
import { z } from "zod";
import {
  authSchema,
  expenseSchema,
  donationSchema,
  campaignSchema,
  donorSchema,
  beneficiarySchema,
} from "../schemas/index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ray-of-hope-secret-key";

// ---------- AUTH ----------
export const login = async (req, res) => {
  try {
    const { username, accessKey } = authSchema.parse(req.body);

    const validCredentials = [
      { username: "admin", key: "ray-hope-2024" },
      { username: "staff", key: "staff-access-2024" },
    ];

    const user = validCredentials.find(
      (u) => u.username === username && u.key === accessKey
    );

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid login data", details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

// ---------- DASHBOARD ----------
export const getDashboardStats = async (req, res) => {
  try {
    const [totalDonations, totalExpenses, activeCampaigns, recentDonors] =
      await Promise.all([
        prisma.donation.aggregate({ _sum: { amount: true } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.campaign.count({ where: { status: "ACTIVE" } }),
        prisma.donation.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { donor: true, campaign: true },
        }),
      ]);

    res.json({
      totalDonations: totalDonations._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      activeCampaigns,
      recentDonors,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

// ---------- EXPENSES ----------
export const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

export const createExpense = async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: "Invalid expense data", details: error.errors });
  }
};

// ---------- DONATIONS ----------
export const getDonations = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      include: { donor: true, campaign: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(donations);
  } catch {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
};

export const createDonation = async (req, res) => {
  try {
    const data = donationSchema.parse(req.body);
    const donation = await prisma.donation.create({ data });
    res.status(201).json(donation);
  } catch (error) {
    res.status(400).json({ error: "Invalid donation data", details: error.errors });
  }
};

// ---------- CAMPAIGNS ----------
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { _count: { select: { donations: true, expenses: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign = await prisma.campaign.create({ data });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: "Invalid campaign data", details: error.errors });
  }
};

// ---------- DONORS ----------
export const getDonors = async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      include: { _count: { select: { donations: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(donors);
  } catch {
    res.status(500).json({ error: "Failed to fetch donors" });
  }
};

export const createDonor = async (req, res) => {
  try {
    const data = donorSchema.parse(req.body);
    const donor = await prisma.donor.create({ data });
    res.status(201).json(donor);
  } catch (error) {
    res.status(400).json({ error: "Invalid donor data", details: error.errors });
  }
};

// ---------- BENEFICIARIES ----------
export const getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(beneficiaries);
  } catch {
    res.status(500).json({ error: "Failed to fetch beneficiaries" });
  }
};

export const createBeneficiary = async (req, res) => {
  try {
    const data = beneficiarySchema.parse(req.body);
    const beneficiary = await prisma.beneficiary.create({ data });
    res.status(201).json(beneficiary);
  } catch (error) {
    res.status(400).json({ error: "Invalid beneficiary data", details: error.errors });
  }
};

// ---------- EXPORT ----------
export const exportExpenses = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenses");

    const expenses = await prisma.expense.findMany({ include: { campaign: true } });

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Campaign", key: "campaign", width: 25 },
    ];

    expenses.forEach((expense) => {
      worksheet.addRow({
        date: expense.createdAt.toISOString().split("T")[0],
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        campaign: expense.campaign?.name || "N/A",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ error: "Failed to export expenses" });
  }
};
