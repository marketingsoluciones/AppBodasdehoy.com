// @ts-ignore — html2canvas sin tipos declarados
import html2canvas from 'html2canvas';
// @ts-ignore — jspdf sin tipos declarados
import { jsPDF } from "jspdf";

export const PrintDocumentPDF = (element) => {
    
    html2canvas(element).then(
        (canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'JPEG', 0, 0);
            pdf.save("download.pdf");
        }
    )
}