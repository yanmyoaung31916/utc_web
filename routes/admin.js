const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// NOTE: Public GET endpoints (no auth). Mutating endpoints require auth per-route.

// Helper function to read JSON file
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to read ${filename}: ${error.message}`);
  }
};

// Helper function to write JSON file
const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write ${filename}: ${error.message}`);
  }
};

// ===== COURSES ROUTES =====

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await readJsonFile('courses.json');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single course
router.get('/courses/:id', async (req, res) => {
  try {
    const courses = await readJsonFile('courses.json');
    const course = courses.find(c => c.id === req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new course
router.post('/courses', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('level').notEmpty().withMessage('Level is required'),
  body('image').notEmpty().withMessage('Image is required'),
  body('outlines').isArray({ min: 1 }).withMessage('At least one outline is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const courses = await readJsonFile('courses.json');
    const newCourse = {
      id: Date.now().toString(), // Simple ID generation
      ...req.body,
      alt: req.body.alt || req.body.title
    };

    courses.push(newCourse);
    await writeJsonFile('courses.json', courses);

    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('level').notEmpty().withMessage('Level is required'),
  body('image').notEmpty().withMessage('Image is required'),
  body('outlines').isArray({ min: 1 }).withMessage('At least one outline is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const courses = await readJsonFile('courses.json');
    const courseIndex = courses.findIndex(c => c.id === req.params.id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    courses[courseIndex] = {
      ...courses[courseIndex],
      ...req.body,
      id: req.params.id // Ensure ID doesn't change
    };

    await writeJsonFile('courses.json', courses);
    res.json(courses[courseIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courses = await readJsonFile('courses.json');
    const filteredCourses = courses.filter(c => c.id !== req.params.id);

    if (courses.length === filteredCourses.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await writeJsonFile('courses.json', filteredCourses);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SERVICES ROUTES =====

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await readJsonFile('services.json');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single service
router.get('/services/:id', async (req, res) => {
  try {
    const services = await readJsonFile('services.json');
    const service = services.find(s => s.id == req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new service
router.post('/services', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('images').isObject().withMessage('Images object is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const services = await readJsonFile('services.json');
    const newService = {
      id: Date.now(), // Simple ID generation
      ...req.body
    };

    services.push(newService);
    await writeJsonFile('services.json', services);

    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update service
router.put('/services/:id', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('images').isObject().withMessage('Images object is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const services = await readJsonFile('services.json');
    const serviceIndex = services.findIndex(s => s.id == req.params.id);

    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }

    services[serviceIndex] = {
      ...services[serviceIndex],
      ...req.body,
      id: parseInt(req.params.id) // Ensure ID doesn't change
    };

    await writeJsonFile('services.json', services);
    res.json(services[serviceIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete service
router.delete('/services/:id', authenticateToken, async (req, res) => {
  try {
    const services = await readJsonFile('services.json');
    const filteredServices = services.filter(s => s.id != req.params.id);

    if (services.length === filteredServices.length) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await writeJsonFile('services.json', filteredServices);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CONTACT ROUTES =====

// Get contact information
router.get('/contact', async (req, res) => {
  try {
    const contact = await readJsonFile('contact.json');
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact information
router.put('/contact', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isArray({ min: 1 }).withMessage('At least one phone number is required'),
  body('social').isObject().withMessage('Social media object is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await writeJsonFile('contact.json', req.body);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
