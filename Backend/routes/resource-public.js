const express = require('express');
const router = express.Router();
const {getAllResources, getSingleResource, getSimilarResources} = require('../controllers/resource-public');
const {getResourcesValidationMiddleware, getResourceByIdValidationMiddleware} = require('../middlewares/resource-public-validation');

router.get('/get-all-resources', getResourcesValidationMiddleware, getAllResources);
router.get('/get-single-resource/:id', getResourceByIdValidationMiddleware, getSingleResource);
router.get('/similar/:id', getSimilarResources);

module.exports = router;