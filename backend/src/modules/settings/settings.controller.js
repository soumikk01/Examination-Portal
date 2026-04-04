import prisma from '../../database/database.js';

// Allowed setting keys — prevents arbitrary key injection into SystemSettings
const ALLOWED_KEYS = [
  'academicYear', 
  'semester', 
  'dateFormat',
  'maintenanceMode', 
  'noticeBoardMessage', 
  'sessionTimeout',
  'contactEmail', 
  'portalTitle'
];

const toBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export const getSettings = async (req, res, next) => {
  try {
    const settingsRows = await prisma.systemSetting.findMany();
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.key] = toBoolean(row.value);
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => ALLOWED_KEYS.includes(key))
    );

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid settings keys provided.' });
    }

    const updatePromises = Object.entries(safeUpdates).map(([key, value]) => {
      const stringValue = String(value);
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    });

    await Promise.all(updatePromises);

    const settingsRows = await prisma.systemSetting.findMany();
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.key] = toBoolean(row.value);
      return acc;
    }, {});

    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    next(err);
  }
};
