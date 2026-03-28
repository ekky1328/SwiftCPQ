import { notFound, errorHandler } from '../../src/middlewares';
import type { Request, Response, NextFunction } from 'express';

function mockReq(url = '/missing'): Partial<Request> {
  return { originalUrl: url };
}

function mockRes(): { status: jest.Mock; json: jest.Mock; statusCode: number } {
  const res = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  // Mirror real Express behaviour: res.status(code) sets statusCode
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

describe('notFound', () => {
  it('sets status 404 and calls next with an error', () => {
    const req = mockReq('/api/unknown');
    const res = mockRes();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    notFound(req as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const err = next.mock.calls[0][0] as unknown as Error;
    expect(err.message).toContain('/api/unknown');
  });
});

describe('errorHandler', () => {
  it('uses existing status code when not 200', () => {
    const req = mockReq();
    const res = mockRes();
    res.statusCode = 422;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const err = new Error('Validation failed');

    errorHandler(err, req as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' }),
    );
  });

  it('defaults to status 500 when statusCode is 200', () => {
    const req = mockReq();
    const res = mockRes(); // statusCode starts at 200
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const err = new Error('Internal error');

    errorHandler(err, req as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack trace in non-production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const err = new Error('Test error');

    errorHandler(err, req as Request, res as unknown as Response, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.stack).not.toBe('🥞');

    process.env.NODE_ENV = original;
  });

  it('hides stack trace in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const err = new Error('Prod error');

    errorHandler(err, req as Request, res as unknown as Response, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.stack).toBe('🥞');

    process.env.NODE_ENV = original;
  });
});
