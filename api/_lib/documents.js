const DOCUMENTS = [
  {
    id: "catalogo-distribuidor",
    label: "Catalogo Distribuidor",
    filename: "catalogo-distribuidor.pdf",
  },
  {
    id: "catalogo-cliente-final",
    label: "Catalogo Cliente Final",
    filename: "catalogo-cliente-final.pdf",
  },
  {
    id: "catalogo-regimen-simplificado",
    label: "Catalogo Regimen Simplificado",
    filename: "catalogo-regimen-simplificado.pdf",
  },
  {
    id: "catalogo-sin-precios",
    label: "Catalogo Sin Precios",
    filename: "catalogo-sin-precios.pdf",
  },
  {
    id: "catalogo-sin-precios-regimen-simplificado",
    label: "Catalogo Sin Precios Regimen Simplificado",
    filename: "catalogo-sin-precios-regimen-simplificado.pdf",
  },
];

const DOCUMENTS_BY_ID = Object.fromEntries(DOCUMENTS.map((doc) => [doc.id, doc]));
const DOCUMENTS_BY_FILENAME = Object.fromEntries(
  DOCUMENTS.map((doc) => [doc.filename, doc]),
);

module.exports = {
  DOCUMENTS,
  DOCUMENTS_BY_ID,
  DOCUMENTS_BY_FILENAME,
};
