import { Language } from '@self/types';
import { validation } from '@self/validation';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { serializeError } from 'serialize-error';
import { z } from 'zod';

type Meta = Record<string, unknown>;
type ExceptionCtaType = 'support-contact';

type ExceptionCta = {
  type: ExceptionCtaType;
  url: string;
};

const ctaByType: Record<ExceptionCtaType, ExceptionCta> = {
  'support-contact': {
    type: 'support-contact',
    url: 'https://support.coolab.ai',
  },
};

export type ExceptionParams = {
  code?: string;
  ctaType?: ExceptionCtaType;
  feedback: Record<Language, string>;
  message: string;
  meta?: Meta;
  shouldAlert?: boolean;
  status: ContentfulStatusCode;
};

export abstract class Exception extends Error {
  public readonly code?: string;
  public readonly cta?: ExceptionCta;
  public readonly feedback: Record<Language, string>;
  public readonly meta?: Meta;
  public readonly shouldAlert: boolean;
  public readonly status: ContentfulStatusCode;

  constructor(params: ExceptionParams) {
    super(params.message);

    this.code = params.code;
    this.cta = params.ctaType ? ctaByType[params.ctaType] : undefined;
    this.feedback = params.feedback;
    this.meta = params.meta;
    this.name = this.constructor.name;
    this.shouldAlert = params.shouldAlert ?? true;
    this.status = params.status;
  }

  public toJson() {
    return serializeError(this);
  }

  public toString() {
    return JSON.stringify(this.toJson());
  }

  public toHandlerResponse(): z.infer<ReturnType<ReturnType<typeof validation>['exception']>> {
    return {
      code: this.code,
      cta: this.cta,
      feedback: this.feedback,
      message: this.message,
      name: this.name,
    };
  }
}
