function isBlankValue_(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return value.trim() === '';
}

function normalizeTextValue_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeValidationPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  var itemSource = (safePayload.item && typeof safePayload.item === 'object') ? safePayload.item : safePayload;
  var modeRaw = safePayload.mode || safePayload.target || safePayload.operation || '';
  var mode = normalizeTextValue_(modeRaw).toLowerCase();

  if (mode !== 'create' && mode !== 'update') {
    mode = normalizeTextValue_(itemSource.id) ? 'update' : 'create';
  }

  return {
    mode: mode,
    item: itemSource
  };
}

function addValidationIssue_(issues, level, code, field, message, value) {
  var issue = {
    code: code,
    field: field,
    message: message
  };
  if (value !== undefined) issue.value = value;
  if (level === 'warning') {
    issues.warnings.push(issue);
    return;
  }
  issues.errors.push(issue);
}

function normalizeNumberish_(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isFinite(value) ? value : NaN;
  var text = String(value).replace(/[\s,，￥¥]/g, '');
  if (!text) return null;
  var parsed = Number(text);
  return isNaN(parsed) ? NaN : parsed;
}

function validateVariationPayloadRaw_(payload) {
  var normalized = normalizeValidationPayload_(payload);
  var item = normalized.item && typeof normalized.item === 'object' ? normalized.item : {};
  var issues = {
    errors: [],
    warnings: []
  };
  var mode = normalized.mode;
  var requiredFields = mode === 'update' ? ['id'] : ['shop'];
  var statusList = getStatusList_();
  var shopMaster = getMasterValueListByType_('shops');
  var amountFields = ['cost', 'listPrice', 'negotiatedPrice', 'priceFinal', 'fee', 'shipping'];

  requiredFields.forEach(function(field) {
    if (!isBlankValue_(item[field])) return;
    addValidationIssue_(
      issues,
      'error',
      'REQUIRED',
      field,
      field + ' is required',
      item[field]
    );
  });

  if (!isBlankValue_(item.status)) {
    var statusValue = normalizeTextValue_(item.status);
    if (statusList.indexOf(statusValue) === -1) {
      addValidationIssue_(
        issues,
        'error',
        'INVALID_STATUS',
        'status',
        'status is not in master list',
        item.status
      );
    }
  } else if (mode === 'create') {
    addValidationIssue_(
      issues,
      'warning',
      'DEFAULT_STATUS',
      'status',
      'status is empty. createItem default is applied: ' + CONFIG.STATUS.LISTING
    );
  }

  if (!isBlankValue_(item.shop)) {
    var shopValue = normalizeTextValue_(item.shop);
    if (shopMaster.length && shopMaster.indexOf(shopValue) === -1) {
      addValidationIssue_(
        issues,
        'error',
        'INVALID_SHOP',
        'shop',
        'shop is not in master list',
        item.shop
      );
    } else if (!shopMaster.length) {
      addValidationIssue_(
        issues,
        'warning',
        'SHOP_MASTER_EMPTY',
        'shop',
        'shop master list is empty. strict validation skipped'
      );
    }

    if (mode === 'create') {
      try {
        if (!generateId_(shopValue)) {
          addValidationIssue_(
            issues,
            'error',
            'SHOP_ID_PREFIX_UNAVAILABLE',
            'shop',
            'shop cannot generate management id prefix',
            item.shop
          );
        }
      } catch (error) {
        addValidationIssue_(
          issues,
          'warning',
          'SHOP_ID_VALIDATION_FAILED',
          'shop',
          'shop id-prefix check failed: ' + String(error)
        );
      }
    }
  }

  amountFields.forEach(function(field) {
    if (isBlankValue_(item[field])) return;
    var num = normalizeNumberish_(item[field]);
    if (!isNaN(num)) return;
    addValidationIssue_(
      issues,
      'error',
      'INVALID_NUMBER',
      field,
      field + ' must be numeric',
      item[field]
    );
  });

  return convertValueKeysToApi_({
    ok: issues.errors.length === 0,
    mode: mode,
    errors: issues.errors,
    warnings: issues.warnings
  });
}

function api_validateVariation(payload) {
  try {
    var result = validateVariationPayloadRaw_(payload);
    if (!result.ok) {
      return buildApiErrorResponse_(
        'validation failed',
        'VALIDATION_FAILED',
        result,
        {
          extra: {
            mode: result.mode,
            errors: result.errors || [],
            warnings: result.warnings || []
          }
        }
      );
    }
    return buildApiSuccessResponse_(result, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('api_validateVariation error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'VALIDATION_INTERNAL_ERROR',
      undefined,
      {
        extra: {
          errors: [{
            code: 'INTERNAL_ERROR',
            field: '',
            message: String(error)
          }],
          warnings: []
        }
      }
    );
  }
}

function validateVariation(payload) {
  return api_validateVariation(payload);
}
