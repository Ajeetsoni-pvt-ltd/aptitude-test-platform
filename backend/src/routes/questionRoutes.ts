import { Router } from 'express';
import {
  bulkDeleteQuestions,
  bulkUploadQuestions,
  createQuestion,
  deleteQuestion,
  downloadBulkTemplate,
  getAllQuestions,
  getAllTopics,
  getQuestionById,
  getSubtopicsForTopic,
  getQuestionMetadata,
  updateQuestion,
} from '../controllers/questionController';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { bulkQuestionUpload, manualQuestionUpload } from '../config/questionUpload';

const router = Router();

router.get('/', getAllQuestions);
router.get('/metadata/all', getQuestionMetadata);
router.get('/metadata/topics', getAllTopics);
router.get('/metadata/subtopics', getSubtopicsForTopic);
router.get('/bulk-template', protect, adminOnly, downloadBulkTemplate);
router.delete('/bulk-delete', protect, adminOnly, bulkDeleteQuestions);
router.post('/bulk-upload', protect, adminOnly, bulkQuestionUpload, bulkUploadQuestions);
router.post('/', protect, adminOnly, manualQuestionUpload, createQuestion);
router.get('/:id', getQuestionById);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

export default router;
