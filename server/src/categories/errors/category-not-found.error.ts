export class CategoryNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Category not found: ${id}` : "Category not found");
    this.name = "CategoryNotFoundError";
  }
}
