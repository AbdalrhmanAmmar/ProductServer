const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Create a new user with role
router.post('/', requireUser, async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    
    console.log(`Creating new user: ${email} with role: ${role || 'user'}`);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await UserService.create({ email, password, role, name });
    
    console.log(`User created successfully: ${user._id}`);
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    
    if (error.message.includes('User with this email already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Role must be either')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user details by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching user details for ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await UserService.get(id);
    
    if (!user) {
      console.log(`User not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`User details fetched successfully: ${user.email}`);
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    
    // Handle invalid ObjectId format
    if (error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// Update user by ID (partial update)

module.exports = router;