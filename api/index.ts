import app from '../server';

export default async (req: any, res: any) => {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ 
      error: "Vercel Function Invocation Failed", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
