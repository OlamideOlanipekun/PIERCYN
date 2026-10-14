import { Router, Request, Response } from 'express';
import { ReviewService } from './reviewService';
import { AuthService } from '../../services/authService';

export const reviewRouter = Router({ mergeParams: true });

const getAuthToken = (req: Request): string => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return (req.headers['x-auth-token'] as string) || '';
};

reviewRouter.get('/products/:productId/reviews', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { page, limit, sort } = req.query;

    const result = await ReviewService.getProductReviews(productId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as 'recent' | 'highest' | 'lowest',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch reviews' });
  }
});

reviewRouter.get('/products/:productId/reviews/summary', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const summary = await ReviewService.getProductRatingSummary(productId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch rating summary' });
  }
});

reviewRouter.post('/products/:productId/reviews', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, reviewerDisplayName, reviewerEmail, title, body, orderNumber } = req.body;

    const token = getAuthToken(req);
    let customerId: string | undefined;
    let customerEmail = reviewerEmail;

    if (token) {
      try {
        const user = await AuthService.getUserByToken(token);
        if (user) {
          customerId = user.id;
          if (!customerEmail) customerEmail = user.email;
        }
      } catch {
        // continue as guest
      }
    }

    const result = await ReviewService.createReview({
      productId,
      rating,
      reviewerDisplayName,
      reviewerEmail: customerEmail,
      title,
      body,
      orderNumber,
      customerId,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.review,
      requiresModeration: result.requiresModeration,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Unable to submit review. Please check your input.',
    });
  }
});

reviewRouter.patch('/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const token = getAuthToken(req);
    let customerId: string | undefined;
    let customerEmail = (req.body.reviewerEmail || req.query.email) as string | undefined;

    if (token) {
      const user = await AuthService.getUserByToken(token);
      if (user) {
        customerId = user.id;
        customerEmail = user.email;
      }
    }

    if (!customerId && !customerEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication or verified email is required to update this review.',
      });
    }

    const { rating, title, body } = req.body;
    const updated = await ReviewService.updateReview(
      reviewId,
      { customerId, customerEmail },
      { rating, title, body }
    );

    res.json({
      success: true,
      message: 'Review updated successfully and resubmitted for approval.',
      data: updated,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to update review.' });
  }
});

reviewRouter.delete('/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const token = getAuthToken(req);
    let customerId: string | undefined;
    let customerEmail = (req.body?.reviewerEmail || req.query?.email) as string | undefined;

    if (token) {
      const user = await AuthService.getUserByToken(token);
      if (user) {
        customerId = user.id;
        customerEmail = user.email;
      }
    }

    if (!customerId && !customerEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication or verified email is required to withdraw this review.',
      });
    }

    const result = await ReviewService.withdrawReview(reviewId, { customerId, customerEmail });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to withdraw review.' });
  }
});
