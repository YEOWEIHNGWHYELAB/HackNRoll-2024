import csv
import hashlib


def hash_and_replace(input_csv, column_index):
    # Create a temporary list to store the rows with hashed values
    new_rows = []

    with open(input_csv, 'r', newline='') as csvfile:
        # Create a CSV reader
        csv_reader = csv.reader(csvfile)

        # Skip header
        header = next(csv_reader)

        for row in csv_reader:
            # Check if the row has enough columns
            if len(row) > column_index:
                # Get the value in the specified column
                column_value = row[column_index]

                # Hash the column value using SHA-256
                sha256_hash = hashlib.sha256()
                sha256_hash.update(column_value.encode('utf-8'))
                hashed_value = sha256_hash.hexdigest()

                # Replace the original value with the hashed value
                row[column_index] = hashed_value

            # Append the modified row to the new list
            new_rows.append(row)

    # Write the modified rows back to the CSV file
    with open(input_csv, 'w', newline='') as csvfile:
        # Create a CSV writer
        csv_writer = csv.writer(csvfile)

        # Write the header
        csv_writer.writerow(header)

        # Write the new rows to the CSV file
        csv_writer.writerows(new_rows)


# Example usage
input_csv = '../testdata/pwdcsv/chrome-pwd.csv'
column_index = 3

hash_and_replace(input_csv, column_index)
