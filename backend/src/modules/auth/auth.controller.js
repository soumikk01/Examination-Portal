import * as authService from './auth.service.js';

export async function login(req, res, next) {
  try {
    const { collegeId, verification } = req.body;

    const result = await authService.login(collegeId, verification);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (result.error === 'VERIFICATION_FAILED') {
      return res.status(403).json({ error: 'Verification failed. Check your credentials.' });
    }

    res.cookie('student_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.tokenMaxAge || 8 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      requestId: req.id,
      student: result.student,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.adminLogin(email, password);

    if (result.error === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.cookie('admin_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.tokenMaxAge || 8 * 60 * 60 * 1000
    });

    res.json({
      message: 'Admin login successful',
      requestId: req.id,
      staff: result.staff,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminPassword(req, res, next) {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const result = await authService.updateAdminPassword(adminId, currentPassword, newPassword);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Admin not found' });
    }
    if (result.error === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie('student_token');
  res.clearCookie('admin_token');
  res.clearCookie('token'); // belt-and-suspenders: clear any lingering old cookie
  res.json({ message: 'Logged out successfully' });
}
