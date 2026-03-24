function buildUiApiSuccessResponse_(data) {
  return buildApiSuccessResponse_(data);
}

function buildUiApiErrorResponse_(message, details, code) {
  return buildApiErrorResponse_(message, code, details);
}

function normalizeUiApiErrorMessage_(error) {
  if (error && typeof error === 'object' && error.message) {
    return String(error.message);
  }
  return String(error || 'unexpected error');
}

function extractUiFilterPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  if (safePayload.filter && typeof safePayload.filter === 'object' && !Array.isArray(safePayload.filter)) {
    return safePayload.filter;
  }

  var directFilter = {};
  Object.keys(ITEM_FIELD_TO_HEADER).forEach(function(field) {
    if (!Object.prototype.hasOwnProperty.call(safePayload, field)) return;
    directFilter[field] = safePayload[field];
  });
  return directFilter;
}

function resolveZipCodeFromPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  var zip = safePayload.zip;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.zipcode;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.postalCode;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.postcode;
  return String(zip || '').trim();
}

function api_uiLookupZip(payload) {
  try {
    var zipInput = resolveZipCodeFromPayload_(payload);
    if (!zipInput) {
      return buildUiApiErrorResponse_('zip is required', undefined, 'ZIP_REQUIRED');
    }

    var normalizedZip = zipInput.replace(/[-\s]/g, '');
    if (!/^\d{7}$/.test(normalizedZip)) {
      return buildUiApiErrorResponse_('zip must be 7 digits', undefined, 'ZIP_INVALID_FORMAT');
    }

    if (typeof lookupAddressByZip !== 'function') {
      return buildUiApiErrorResponse_('lookupAddressByZip is not available', undefined, 'ZIP_LOOKUP_UNAVAILABLE');
    }

    var address = lookupAddressByZip(normalizedZip);
    if (!address) {
      return buildUiApiErrorResponse_('address not found', undefined, 'ZIP_NOT_FOUND');
    }

    return buildUiApiSuccessResponse_({
      zip: normalizedZip,
      prefecture: address.prefecture || '',
      city: address.city || '',
      town: address.town || '',
      addressLine: String((address.city || '') + (address.town || ''))
    });
  } catch (error) {
    Logger.log('api_uiLookupZip error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'ZIP_LOOKUP_FAILED');
  }
}

function api_uiDashboardKpi(payload) {
  try {
    var summary = getDashboardSummaryRaw_(extractUiFilterPayload_(payload));
    return buildUiApiSuccessResponse_(summary);
  } catch (error) {
    Logger.log('api_uiDashboardKpi error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'DASHBOARD_KPI_FAILED');
  }
}

function api_uiExportCsv(payload) {
  try {
    var csv = exportCsvRaw_(extractUiFilterPayload_(payload));
    var csvText = String(csv || '');
    var body = csvText.replace(/^\uFEFF/, '');
    var lineCount = body ? body.split(/\r\n|\n|\r/).length : 0;

    return buildUiApiSuccessResponse_({
      csv: csvText,
      mimeType: 'text/csv',
      encoding: 'UTF-8',
      hasBom: csvText.indexOf('\uFEFF') === 0,
      lineCount: lineCount
    });
  } catch (error) {
    Logger.log('api_uiExportCsv error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'EXPORT_CSV_FAILED');
  }
}

function api_dispatchAction(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var action = String(payload.action || '').trim();

  switch (action) {
    case 'uiLookupZip':
    case 'uiZipLookup':
    case 'uiPostalCodeLookup':
    case 'uiPostalCodeAutocomplete':
      return api_uiLookupZip(payload);
    case 'uiDashboardKpi':
    case 'uiDashboardSummary':
      return api_uiDashboardKpi(payload);
    case 'uiExportCsv':
    case 'uiCsvExport':
      return api_uiExportCsv(payload);
    case 'validateVariation':
    case 'variationValidation':
    case 'checkVariation':
      return api_validateVariation(payload);
    case 'getMonthlySummary':
    case 'monthlySummary':
      return api_getMonthlySummary();
    case 'getPlatformSummary':
    case 'platformSummary':
    case 'getShopSummary':
    case 'shopSummary':
      return api_getPlatformSummary();
    case 'getMasters':
    case 'masters':
    case 'getMaster':
    case 'master':
      return api_getMasters(payload);
    case 'listItemsSorted':
    case 'sortedItems':
    case 'getSortedItems':
      return api_listItemsSorted(payload);
    case 'cancelItem':
    case 'cancelStatus':
    case 'cancelTransaction':
    case 'cancel':
      return api_cancelItem(payload);
    case 'disableItem':
    case 'disable':
      return api_disableItem(payload);
    case 'archiveItem':
    case 'archive':
      return api_archiveItem(payload);
    case 'bulkDisableNetshopRecords':
    case 'bulkDisableNetshop':
    case 'bulkDisableItems':
    case 'bulkDisable':
      return api_bulkDisableNetshop(payload);
    default:
      return buildApiErrorResponse_(
        action ? ('unknown action: ' + action) : 'action is required',
        'UNKNOWN_ACTION'
      );
  }
}
