import csv
import re


def is_email(candidate):
    # Basic email validation using a regular expression
    email_pattern = re.compile(r"[^@]+@[^@]+\.[^@]+")
    return bool(re.match(email_pattern, candidate))


def get_provider(email):
    # Extracting domain from email
    _, domain = email.split('@', 1)
    return domain


file_path = "../testdata/pwdcsv/chrome-pwd.csv"

unique_providers = set()

with open(file_path, "r", newline="", encoding="utf-8") as csvfile:
    csv_reader = csv.reader(csvfile)

    for row in csv_reader:
        # Check if the row has at least 3 columns
        if len(row) >= 3:
            email_candidate = row[2]  # Assuming the index starts from 0
            if is_email(email_candidate):
                # print(email_candidate)
                # print(provider_name)
                provider_name = get_provider(email_candidate)
                unique_providers.add(provider_name)

# Print unique provider names
for provider in unique_providers:
    print(provider)
