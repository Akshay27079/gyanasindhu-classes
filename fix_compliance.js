const fs = require('fs');
let c = fs.readFileSync('app.html', 'utf8');

// Find the block by key unique markers and replace between them
const start = c.indexOf('            try {\n                const routeCheck = await fetch');
const end = c.indexOf("                if (!result.data?.templateName) {\n                    throw new Error('Webhook did not confirm the template used. Redeploy WhatsApp_Webhook_Updated.gs as the active Apps Script web app.');\n                }");
const endFull = end + "                if (!result.data?.templateName) {\n                    throw new Error('Webhook did not confirm the template used. Redeploy WhatsApp_Webhook_Updated.gs as the active Apps Script web app.');\n                }".length;

if (start === -1 || end === -1) {
    console.log('Block not found. start:', start, 'end:', end);
    process.exit(1);
}

const newBlock = `            try {
                const formattedDate = new Date(notice.date).toLocaleDateString('en-IN');
                const response = await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        noticeType: 'compliance',
                        parentPhone,
                        parentName: student.parentName || 'Parent',
                        studentName: student.name,
                        className: student.class,
                        date: formattedDate,
                        reason: getComplianceReasonLabel(notice.reason),
                        details: notice.details || '-'
                    }),
                    redirect: 'follow'
                });

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (error) {
                    throw new Error(\`Webhook returned invalid JSON (\${response.status})\`);
                }
                if (!response.ok || !result.success) {
                    throw new Error(formatWhatsAppWebhookError(result.error || result.message || \`Webhook failed with HTTP \${response.status}\`));
                }`;

c = c.substring(0, start) + newBlock + c.substring(endFull);
fs.writeFileSync('app.html', c, 'utf8');
console.log('SUCCESS - replaced lines', start, 'to', endFull);
