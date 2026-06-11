export const STORAGE_ACCESS_TEST_PATHS = {
  testDir: ".fluxor-permission-test",
  testFile: "write-test.txt",
  testContent: "fluxor-permission-test",
} as const;

export const STORAGE_ACCESS_VALIDATION_SUCCESS_MESSAGE =
  "Pasta validada com sucesso.";

export const STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE =
  "Não foi possível escrever nesta pasta. Verifique as permissões.";
