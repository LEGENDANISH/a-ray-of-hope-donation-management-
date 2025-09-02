// index.js (Backend - Corrected for ES Modules)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "ray-of-hope-secret-key";

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting

// ----------------- Validation Schemas -----------------
const authSchema = z.object({
  username: z.string().min(1),
  accessKey: z.string().min(1),
});

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  campaignId: z.string().optional(),
});

const donationSchema = z.object({
  amount: z.number().positive(),
  donorId: z.string(),
  campaignId: z.string().optional(),
});

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).default("ACTIVE"),
});

const donorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const beneficiarySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  contactInfo: z.string().optional(),
});

// ----------------- Auth Middleware -----------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ----------------- Auth Routes -----------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, accessKey } = authSchema.parse(req.body);

    // Demo hardcoded users
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
      res
        .status(400)
        .json({ error: "Invalid login data", details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// ----------------- Dashboard -----------------
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
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
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// ----------------- Expenses -----------------
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid expense data", details: error.errors });
    } else {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  }
});

// ----------------- Donations -----------------
app.get("/api/donations", authenticateToken, async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      include: { donor: true, campaign: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(donations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

app.post("/api/donations", authenticateToken, async (req, res) => {
  try {
    const data = donationSchema.parse(req.body);
    const donation = await prisma.donation.create({ data });
    res.status(201).json(donation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid donation data", details: error.errors });
    } else {
      console.error("Error creating donation:", error);
      res.status(500).json({ error: "Failed to create donation" });
    }
  }
});

// ----------------- Campaigns -----------------
app.get("/api/campaigns", authenticateToken, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: { select: { donations: true, expenses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

app.post("/api/campaigns", authenticateToken, async (req, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign = await prisma.campaign.create({ data });
    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid campaign data", details: error.errors });
    } else {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  }
});

// ----------------- Donors -----------------
app.get("/api/donors", authenticateToken, async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      include: { _count: { select: { donations: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(donors);
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ error: "Failed to fetch donors" });
  }
});

app.post("/api/donors", authenticateToken, async (req, res) => {
  try {
    const data = donorSchema.parse(req.body);
    const donor = await prisma.donor.create({ data });
    res.status(201).json(donor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid donor data", details: error.errors });
    } else {
      console.error("Error creating donor:", error);
      res.status(500).json({ error: "Failed to create donor" });
    }
  }
});

// ----------------- Beneficiaries -----------------
app.get("/api/beneficiaries", authenticateToken, async (req, res) => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(beneficiaries);
  } catch (error) {
    console.error("Error fetching beneficiaries:", error);
    res.status(500).json({ error: "Failed to fetch beneficiaries" });
  }
});

app.post("/api/beneficiaries", authenticateToken, async (req, res) => {
  try {
    const data = beneficiarySchema.parse(req.body);
    const beneficiary = await prisma.beneficiary.create({ data });
    res.status(201).json(beneficiary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid beneficiary data", details: error.errors });
    } else {
      console.error("Error creating beneficiary:", error);
      res.status(500).json({ error: "Failed to create beneficiary" });
    }
  }
});

// ----------------- Export to Excel -----------------
app.get("/api/export/expenses", authenticateToken, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenses");

    const expenses = await prisma.expense.findMany({
      include: { campaign: true },
    });

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
  } catch (error) {
    console.error("Error exporting expenses:", error);
    res.status(500).json({ error: "Failed to export expenses" });
  }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
