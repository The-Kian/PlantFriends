{ pkgs }: {
  packages = [
    pkgs.nodejs_20 # Or your preferred Node.js version
    
    # other packages you need
    pkgs.yarn
  ];
}