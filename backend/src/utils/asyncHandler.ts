// Kyun banate hain? 🤔
// Har controller function mein try-catch likhna padta hai — yeh repetitive hai.
//  Real companies mein ek wrapper function banate hain jo automatically errors catch kare.




// backend/src/utils/asyncHandler.ts
// ─────────────────────────────────────────────────────────────
// asyncHandler: try-catch wrapper for all async controller functions
// Kyun: Har controller mein try-catch likhna repetitive hai
// Yeh wrapper automatically errors catch karke next(error) pe bhejta hai
// jo phir app.ts ke Global Error Handler mein jaata hai
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction, RequestHandler } from 'express';

// Generic type: koi bhi async function jo req, res, next le
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // fn() run karo, agar error aaye toh next(error) call karo
    // next(error) = Express ko batao ki error aaya → Global Error Handler chalega
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;
