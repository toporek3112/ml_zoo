import logging
import json
import sys
from config import config

class JSONFormatter(logging.Formatter):
  def format(self, record):
    log_record = {
      'ts': self.formatTime(record, self.datefmt),
      'level': record.levelname.lower(),
      'caller': f"{record.filename}:{record.lineno}",
      'message': record.getMessage(),
      'logger': record.name,
      'module': record.module,
      'func': record.funcName,
      'pid': record.process,
      'thread': record.threadName,
    }
    # carry structured extras if provided
    if hasattr(record, 'extra_fields') and isinstance(record.extra_fields, dict):
      log_record.update(record.extra_fields)
    if record.exc_info:
      log_record['exception'] = self.formatException(record.exc_info)
    return json.dumps(log_record)

def setup_json_logger(name: str):
  logger = logging.getLogger(name)
  log_level = getattr(config, 'LOG_LEVEL', logging.INFO)
  logger.setLevel(log_level)
  # Don't disable propagation to avoid conflicts with uvicorn
  
  # add handler once
  if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
  return logger

logger = setup_json_logger("ml_zoo")