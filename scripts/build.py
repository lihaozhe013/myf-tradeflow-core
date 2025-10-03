import os
import sys
import subprocess
import shutil
from pathlib import Path

# ------------ Helper Functions -------------

def rm_dir(DIR, relative_path):
    path = os.path.join(DIR, relative_path)
    print("Checking Path: \"" + path + "\"")
    if os.path.exists(path):
        print("Path Found!")
        try:
            shutil.rmtree(path)
            print("Removed: " + path)
        except:
            print("Cannot Remove \"" + path + "\"")
    else:
        print("Path not found!")

def rm_file(DIR, relative_path):
    path = os.path.join(DIR, relative_path)
    print("Checking Path: \"" + path + "\"")
    if os.path.exists(path):
        print("Path Found!")
        try:
            os.remove(path)
            print("Removed: " + path)
        except:
            print("Cannot Remove \"" + path + "\"")
    else:
        print("Path not found!")

def clean_frontend_src(DIR):
    frontend_path = os.path.join(DIR, "frontend")
    frontend_temp_path = os.path.join(DIR, "frontend_temp")

    os.rename(frontend_path, frontend_temp_path)
    os.makedirs(frontend_path)
    shutil.move(os.path.join(frontend_temp_path, "dist"), os.path.join(frontend_path, "dist"))
    rm_dir(frontend_temp_path)

# -------------- DevOps Steps ---------------

def change2current_dir():
    print("Executing: Get path and change to project dir...")
    try:
        SCRIPT_DIR = Path(__file__).resolve().parent
    except NameError:
        print("Unable to determine the script directory. The script will be run based on the current working directory.", file=sys.stderr)
        SCRIPT_DIR = Path(os.getcwd())
    DIR = SCRIPT_DIR.parent
    os.chdir(DIR)
    return DIR
    
def clean_build(DIR):
    print("Executing: Clean build...")
    rm_dir(DIR, "data/log")
    rm_dir(DIR, "node_modules")
    rm_dir(DIR, "frontend/node_modules")
    rm_dir(DIR, "backend/node_modules")
    rm_dir(DIR, "dist")
    rm_dir(DIR, "frontend/dist")

def install_dependencies_and_build(DIR):
    print("Executing: Install Dependencies and Build...")
    os.chdir(DIR)
    npm_path = shutil.which("npm")
    if not npm_path:
        print("npm executable not found in PATH. Please install Node.js/npm or ensure npm is on PATH.")
        sys.exit(2)

    try:
        print('Running: npm run install:all')
        result = subprocess.run([npm_path, 'run', 'install:all'], capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        print('Running: npm run build')
        result = subprocess.run([npm_path, 'run', 'build'], capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        print("Dependencies Installed and Build Successful.")
    except:
        print("Failed to Install Dependencies and Build.")

def clean_src(DIR):
    print("Executing: Cleaning Source Code...")
    rm_dir(DIR, ".git")
    rm_dir(DIR, "docs")
    clean_frontend_src(DIR)
    print("Source Code Cleared!")
    

DIR = change2current_dir()
clean_build(DIR)
install_dependencies_and_build(DIR)
clean_src(DIR)

