import os

def find_md_files_and_extract_h2(root_folder, output_file):

    h2_titles = []
    
    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.endswith('.md'):
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            stripped_line = line.strip()
                            if stripped_line.startswith('## '):
                                h2_titles.append(stripped_line[3:])
                except Exception as e:
                    print(f"An error occurred while processing the file {file_path}: {e}")

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for title in h2_titles:
                f.write(title + '\n')
        print("Complete!")
    except Exception as e:
        print(f"An error occurred while processing the file {file_path}: {e}")


if __name__ == "__main__":
    target_directory = '.'
    output_filename = 'index.txt'
    find_md_files_and_extract_h2(target_directory, output_filename)
