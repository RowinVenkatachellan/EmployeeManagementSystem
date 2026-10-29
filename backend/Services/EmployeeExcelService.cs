using ClosedXML.Excel;
using backend.Models;

namespace backend.Services;

public class EmployeeExcelService
{
    public byte[] GenerateExcel(List<Employee> employees)
    {
        // Create an Excel workbook in memory.
        using var workbook = new XLWorkbook();

        // Create a worksheet named Employees.
        var worksheet = workbook.Worksheets.Add("Employees");

        // Add column headers.
        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Full Name";
        worksheet.Cell(1, 3).Value = "Email";
        worksheet.Cell(1, 4).Value = "Department";
        worksheet.Cell(1, 5).Value = "Job Title";
        worksheet.Cell(1, 6).Value = "Status";

        // Add employee records, starting from row 2.
        for (int i = 0; i < employees.Count; i++)
        {
            var employee = employees[i];
            int row = i + 2;

            worksheet.Cell(row, 1).Value = employee.Id;
            worksheet.Cell(row, 2).Value = employee.FullName;
            worksheet.Cell(row, 3).Value = employee.Email;
            worksheet.Cell(row, 4).Value = employee.Department;
            worksheet.Cell(row, 5).Value = employee.JobTitle;
            worksheet.Cell(row, 6).Value =
                employee.IsActive ? "Active" : "Inactive";
        }

        // Make the headers bold.
        worksheet.Range(1, 1, 1, 6).Style.Font.Bold = true;

        // Adjust column widths to fit their contents.
        worksheet.Columns().AdjustToContents();

        // Save the workbook into memory instead of a physical file.
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        // Return the Excel file as bytes.
        return stream.ToArray();
    }
}