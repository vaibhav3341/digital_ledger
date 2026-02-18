import firestore from '@react-native-firebase/firestore';
import {PDFDocument, PDFFont, StandardFonts, rgb} from 'pdf-lib';
import {NativeModules, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {LedgerTransaction} from '../models/types';
import {formatDateDDMMYYYY} from '../utils/format';

interface FetchStatementTransactionsParams {
  ledgerId: string;
  recipientId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface GenerateStatementPdfParams {
  adminName: string;
  recipientLabel: string;
  rangeStart: Date;
  rangeEnd: Date;
  transactions: LedgerTransaction[];
  recipientNamesById?: Record<string, string>;
}

export interface GeneratedStatement {
  fileName: string;
  filePath: string;
}

interface DownloadsExportModule {
  savePdfToDownloads(sourceFilePath: string, fileName: string): Promise<string>;
}

const downloadsExportModule = NativeModules.DownloadsExportModule as
  | DownloadsExportModule
  | undefined;

export interface StatementDownloadResult {
  downloadsPathLabel: string;
  downloadsUri: string;
}

export function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function txnAtMillis(item: LedgerTransaction) {
  return item.txnAt?.toMillis?.() || 0;
}

function formatDateForFile(date: Date) {
  return formatDateDDMMYYYY(date).replace(/\//g, '-');
}

function formatAmountForPdf(amountCents: number) {
  return `INR ${(amountCents / 100).toFixed(2)}`;
}

function sanitizeFilePart(value: string) {
  const safe = value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return safe || 'All';
}

function directionLabel(direction: LedgerTransaction['direction']) {
  return direction === 'SENT' ? 'Sent' : 'Received';
}

export async function fetchStatementTransactions({
  ledgerId,
  recipientId,
  startDate,
  endDate,
}: FetchStatementTransactionsParams) {
  if (!ledgerId.trim()) {
    throw new Error('Ledger is required.');
  }

  const startMillis = startDate ? startOfDay(startDate).getTime() : null;
  const endMillis = endOfDay(endDate || new Date()).getTime();
  const snapshot = await firestore()
    .collection('transactions')
    .where('ledgerId', '==', ledgerId)
    .get();

  return snapshot.docs
    .map(doc => doc.data() as LedgerTransaction)
    .filter(transaction => {
      const millis = txnAtMillis(transaction);
      if (!millis) {
        return false;
      }
      if (recipientId && transaction.recipientId !== recipientId) {
        return false;
      }
      if (startMillis !== null && millis < startMillis) {
        return false;
      }
      return millis <= endMillis;
    })
    .sort((left, right) => {
      const leftMillis = txnAtMillis(left);
      const rightMillis = txnAtMillis(right);
      if (leftMillis === rightMillis) {
        return left.txnId.localeCompare(right.txnId);
      }
      return leftMillis - rightMillis;
    });
}

export async function generateStatementPdf({
  adminName,
  recipientLabel,
  rangeStart,
  rangeEnd,
  transactions,
  recipientNamesById,
}: GenerateStatementPdfParams): Promise<GeneratedStatement> {
  const totalSentCents = transactions.reduce((sum, transaction) => {
    if (transaction.direction === 'SENT') {
      return sum + transaction.amountCents;
    }
    return sum;
  }, 0);
  const totalReceivedCents = transactions.reduce((sum, transaction) => {
    if (transaction.direction === 'RECEIVED') {
      return sum + transaction.amountCents;
    }
    return sum;
  }, 0);
  const netCents = totalSentCents - totalReceivedCents;
  const netAmount =
    netCents >= 0
      ? `+${formatAmountForPdf(netCents)}`
      : `-${formatAmountForPdf(Math.abs(netCents))}`;

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const titleColor = rgb(0.12, 0.39, 0.84);
  const textColor = rgb(0.1, 0.13, 0.2);
  const mutedColor = rgb(0.4, 0.45, 0.53);
  const tableBorderColor = rgb(0.78, 0.83, 0.91);
  const tableHeaderColor = rgb(0.92, 0.96, 1);
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (lineGap: number) => {
    if (y - lineGap < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawLine = (params: {
    text: string;
    size?: number;
    bold?: boolean;
    color?: ReturnType<typeof rgb>;
    lineGap?: number;
  }) => {
    const size = params.size ?? 11;
    const lineGap = params.lineGap ?? size + 4;
    ensureSpace(lineGap);
    page.drawText(params.text, {
      x: margin,
      y,
      size,
      font: params.bold ? boldFont : regularFont,
      color: params.color || textColor,
    });
    y -= lineGap;
  };

  const truncateToWidth = (
    value: string,
    maxWidth: number,
    font: PDFFont,
    size: number,
  ) => {
    const normalized = value.replace(/\s+/g, ' ').trim() || '-';
    if (font.widthOfTextAtSize(normalized, size) <= maxWidth) {
      return normalized;
    }

    const ellipsis = '...';
    if (font.widthOfTextAtSize(ellipsis, size) > maxWidth) {
      return '';
    }

    let low = 0;
    let high = normalized.length;
    let best = ellipsis;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = `${normalized.slice(0, mid).trimEnd()}${ellipsis}`;
      const width = font.widthOfTextAtSize(candidate, size);

      if (width <= maxWidth) {
        best = candidate;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  };

  drawLine({
    text: 'Ledger Statement',
    size: 20,
    bold: true,
    color: titleColor,
    lineGap: 28,
  });
  drawLine({text: `Admin: ${adminName}`});
  drawLine({text: `Recipient Filter: ${recipientLabel}`});
  drawLine({
    text: `Date Range: ${formatDateDDMMYYYY(
      rangeStart,
    )} to ${formatDateDDMMYYYY(rangeEnd)}`,
  });
  drawLine({text: `Generated At: ${formatDateDDMMYYYY(new Date())}`});
  y -= 8;

  drawLine({
    text: 'Summary',
    size: 13,
    bold: true,
    color: titleColor,
    lineGap: 20,
  });
  drawLine({text: `Total Sent: ${formatAmountForPdf(totalSentCents)}`});
  drawLine({
    text: `Total Received: ${formatAmountForPdf(totalReceivedCents)}`,
  });
  drawLine({text: `Net: ${netAmount}`});
  y -= 10;

  drawLine({
    text: 'Transactions',
    size: 13,
    bold: true,
    color: titleColor,
    lineGap: 20,
  });
  y -= 4;

  if (transactions.length === 0) {
    drawLine({
      text: 'No transactions for selected filters.',
      color: mutedColor,
    });
  } else {
    type TableAlignment = 'left' | 'right';
    type TableColumn = {
      title: string;
      width: number;
      align?: TableAlignment;
    };

    const tableColumns: TableColumn[] = [
      {title: 'Date', width: 72},
      {title: 'Recipient', width: 132},
      {title: 'Direction', width: 78},
      {title: 'Amount', width: 95, align: 'right'},
      {title: 'Note', width: 138},
    ];
    const tableWidth = tableColumns.reduce(
      (sum, column) => sum + column.width,
      0,
    );
    const headerHeight = 22;
    const rowHeight = 20;
    const cellPaddingX = 6;
    const headerTextSize = 10;
    const rowTextSize = 9;

    const drawTableRow = (params: {
      rowTopY: number;
      values: string[];
      header?: boolean;
    }) => {
      const currentRowHeight = params.header ? headerHeight : rowHeight;

      page.drawRectangle({
        x: margin,
        y: params.rowTopY - currentRowHeight,
        width: tableWidth,
        height: currentRowHeight,
        borderColor: tableBorderColor,
        borderWidth: 0.8,
        color: params.header ? tableHeaderColor : undefined,
      });

      let x = margin;
      tableColumns.forEach((column, index) => {
        const font = params.header ? boldFont : regularFont;
        const size = params.header ? headerTextSize : rowTextSize;
        const rawText = params.values[index] || '';
        const renderedText = truncateToWidth(
          rawText,
          column.width - cellPaddingX * 2,
          font,
          size,
        );
        const textWidth = font.widthOfTextAtSize(renderedText, size);
        const textX =
          column.align === 'right'
            ? x + column.width - cellPaddingX - textWidth
            : x + cellPaddingX;
        const textY = params.rowTopY - (currentRowHeight + size) / 2 + 2;

        page.drawText(renderedText, {
          x: textX,
          y: textY,
          size,
          font,
          color: params.header ? titleColor : textColor,
        });

        x += column.width;
        if (index < tableColumns.length - 1) {
          page.drawLine({
            start: {x, y: params.rowTopY},
            end: {x, y: params.rowTopY - currentRowHeight},
            thickness: 0.8,
            color: tableBorderColor,
          });
        }
      });
    };

    const drawTableHeader = () => {
      ensureSpace(headerHeight + 2);
      drawTableRow({
        rowTopY: y,
        values: tableColumns.map(column => column.title),
        header: true,
      });
      y -= headerHeight;
    };

    drawTableHeader();
    transactions.forEach(transaction => {
      if (y - rowHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawTableHeader();
      }

      const dateText = formatDateDDMMYYYY(transaction.txnAt?.toDate?.());
      const recipientName =
        transaction.recipientNameSnapshot?.trim() ||
        recipientNamesById?.[transaction.recipientId] ||
        'Recipient';
      const direction = directionLabel(transaction.direction);
      const amount = formatAmountForPdf(transaction.amountCents);
      const note = transaction.note?.trim() || '-';

      drawTableRow({
        rowTopY: y,
        values: [dateText, recipientName, direction, amount, note],
      });
      y -= rowHeight;
    });
  }

  const fileName = `Statement_${sanitizeFilePart(
    recipientLabel,
  )}_${formatDateForFile(rangeStart)}_to_${formatDateForFile(rangeEnd)}`;

  const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;
  const base64Pdf = await pdfDoc.saveAsBase64({dataUri: false});
  await RNFS.writeFile(filePath, base64Pdf, 'base64');

  return {
    fileName: `${fileName}.pdf`,
    filePath,
  };
}

export async function saveStatementToDownloads(
  statement: GeneratedStatement,
): Promise<StatementDownloadResult> {
  if (Platform.OS !== 'android') {
    throw new Error('Saving to Downloads is supported only on Android.');
  }

  if (
    !downloadsExportModule ||
    typeof downloadsExportModule.savePdfToDownloads !== 'function'
  ) {
    throw new Error(
      'Downloads export module is unavailable. Rebuild Android app after native changes.',
    );
  }

  const downloadsUri = await downloadsExportModule.savePdfToDownloads(
    statement.filePath,
    statement.fileName,
  );

  return {
    downloadsPathLabel: `Downloads/${statement.fileName}`,
    downloadsUri,
  };
}
