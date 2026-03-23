{
  config,
  inputs,
  pkgs,
  lib,
  ...
}:

{
  env = {
    BASE_URL = "http://127.0.0.1:8000/";
  };

  languages.javascript = {
    enable = true;
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  process.manager.implementation = "process-compose";
  processes = {
    backend =
      let
        podman = lib.getExe pkgs.podman;
      in
      {
        exec = ''
          if [ -n "$(${podman} container ls -qaf name=nuqc-backend)" ]; then
            ${podman} container start -ia nuqc-backend
          else
            ${podman} container run -it -p 8000:8000 --name=nuqc-backend ghcr.io/nu-quran-community/nu-quran-django:latest
          fi
        '';
      };
    devserver =
      let
        pnpm = lib.getExe pkgs.nodePackages.pnpm;
      in
      {
        process-compose.depends_on.backend.condition = "process_started";
        exec = "${pnpm} dev";
      };
  };

  treefmt = {
    enable = true;
    config.programs = {
      nixfmt.enable = true;
      prettier.enable = true;
    };
  };

  git-hooks.hooks = {
    treefmt.enable = true;
  };
}
