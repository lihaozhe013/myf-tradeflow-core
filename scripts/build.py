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
        print("Path Found")
        try:
            shutil.rmtree(path)
            print("Removed: " + path)
        except:
            print("Cannot Remove \"" + path + "\"")
    else:
        print("Path not found, skipped removal.")

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
        print("Path not found, skipped removal.")

def clean_frontend_src(DIR):
    frontend_path = os.path.join(DIR, "frontend")
    dist_path = os.path.join(frontend_path, "dist")
    frontend_temp_relative = "frontend_temp"
    frontend_temp_path = os.path.join(DIR, frontend_temp_relative)

    if not os.path.isdir(frontend_path):
        print(f"Frontend directory not found at {frontend_path}. Skipping frontend cleanup.")
        return

    if not os.path.isdir(dist_path):
        print(f"No build artifacts found at {dist_path}. Skipping frontend cleanup.")
        return

    # Ensure temp directory is clean before proceeding
    rm_dir(DIR, frontend_temp_relative)

    try:
        os.rename(frontend_path, frontend_temp_path)
        os.makedirs(frontend_path, exist_ok=True)
        shutil.move(os.path.join(frontend_temp_path, "dist"), dist_path)
        print("Frontend source cleaned; dist preserved.")
    except Exception as exc:
        print(f"Failed to clean frontend source: {exc}", file=sys.stderr)
        if not os.path.isdir(frontend_path) and os.path.isdir(frontend_temp_path):
            try:
                os.rename(frontend_temp_path, frontend_path)
            except OSError:
                pass
    finally:
        rm_dir(DIR, frontend_temp_relative)

# -------------- DevOps Steps ---------------

def change2current_dir():
    print("------------------------------")
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
    print("------------------------------")
    print("Executing: Clean build...")
    rm_dir(DIR, "node_modules")
    rm_dir(DIR, "frontend/node_modules")
    rm_dir(DIR, "backend/node_modules")
    rm_dir(DIR, "dist")
    rm_dir(DIR, "frontend/dist")

def config_check(DIR):
    print("------------------------------")
    print("Executing: Config Check...")
    config_example_path = os.path.join(DIR, "config-example")
    data_path = os.path.join(DIR, "data")
    if not os.path.exists(data_path):
        try:
            os.rename(config_example_path, data_path)
            print(f"Created missing data directory at {data_path}.")
        except:
            print("Failed to create data directory.")
            sys.exit(1)
    else:
        print(f"Data directory already exists at {data_path}.")
    print("Config Check Completed.")

def install_dependencies_and_build(DIR):
    print("------------------------------")
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
    except:
        print("Failed to Install Dependencies.")
        sys.exit(1)
    try:
        print('Running: npm run build')
        result = subprocess.run([npm_path, 'run', 'build'], capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        print("Dependencies Installed and Build Successful.")
    except:
        print("Failed to Build.")
        sys.exit(1)

def clean_src(DIR):
    print("------------------------------")
    print("Executing: Cleaning Source Code...")
    rm_dir(DIR, ".git")
    rm_dir(DIR, "docs")
    clean_frontend_src(DIR)
    print("Source Code Cleared!")

# -------------- Main Execution --------------
DIR = change2current_dir()
clean_build(DIR)
config_check(DIR)
install_dependencies_and_build(DIR)
clean_src(DIR)
print("Build Process Completed.")

