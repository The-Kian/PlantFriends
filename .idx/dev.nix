
{ pkgs }: {
  packages = [
    pkgs.nodejs_18 # Or your preferred Node.js version
    
    # other packages you need
    pkgs.yarn
  ];
}
