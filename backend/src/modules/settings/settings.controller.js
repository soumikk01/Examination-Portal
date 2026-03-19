import prisma from '../../database/database.js';

export const getSettings = async (req, res, next) => {
  try {
    const settingsRows = await prisma.systemSetting.findMany();
    const settings = settingsRows.reduce((acc, row) => {
      // Convert 'true'/'false' strings back to boolean for maintenanceMode
      let value = row.value;
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      acc[row.key] = value;
      return acc;
    }, {});
    
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { academicYear: '2024-2025', maintenanceMode: true }
    
    // We execute these sequentially or map them to promises
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      const stringValue = typeof value === 'boolean' ? String(value) : String(value);
      
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue }
      });
    });

    await Promise.all(updatePromises);
    
    // Fetch newly updated settings
    const settingsRows = await prisma.systemSetting.findMany();
    const settings = settingsRows.reduce((acc, row) => {
      let val = row.value;
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      acc[row.key] = val;
      return acc;
    }, {});

    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    next(err);
  }
};
