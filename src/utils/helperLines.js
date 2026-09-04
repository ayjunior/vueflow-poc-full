// Calcula linhas-guia de alinhamento (estilo Figma) durante o arraste de um
// nó: compara bordas/centro do nó arrastado com os demais nós e retorna a
// posição (em coordenadas de flow) da linha horizontal/vertical mais próxima
// dentro do raio `distance`, junto com a posição já "encaixada" no alinhamento.
export function getHelperLines(node, nodes, distance = 8) {
  const result = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
  }

  if (!node.dimensions?.width || !node.dimensions?.height) return result

  const a = {
    left: node.position.x,
    right: node.position.x + node.dimensions.width,
    centerX: node.position.x + node.dimensions.width / 2,
    top: node.position.y,
    bottom: node.position.y + node.dimensions.height,
    centerY: node.position.y + node.dimensions.height / 2,
  }

  let closestVertical = distance
  let closestHorizontal = distance

  for (const other of nodes) {
    if (other.id === node.id) continue
    if (!other.dimensions?.width || !other.dimensions?.height) continue

    const b = {
      left: other.position.x,
      right: other.position.x + other.dimensions.width,
      centerX: other.position.x + other.dimensions.width / 2,
      top: other.position.y,
      bottom: other.position.y + other.dimensions.height,
      centerY: other.position.y + other.dimensions.height / 2,
    }

    // eixo X: encosta esquerda-esquerda, direita-direita, centro-centro,
    // e esquerda-direita/direita-esquerda (nós lado a lado)
    for (const [edgeA, edgeB] of [
      [a.left, b.left],
      [a.right, b.right],
      [a.centerX, b.centerX],
      [a.left, b.right],
      [a.right, b.left],
    ]) {
      const diff = Math.abs(edgeA - edgeB)
      if (diff < closestVertical) {
        closestVertical = diff
        result.vertical = edgeB
        result.snapPosition.x = node.position.x + (edgeB - edgeA)
      }
    }

    // eixo Y: topo-topo, base-base, centro-centro, topo-base/base-topo
    for (const [edgeA, edgeB] of [
      [a.top, b.top],
      [a.bottom, b.bottom],
      [a.centerY, b.centerY],
      [a.top, b.bottom],
      [a.bottom, b.top],
    ]) {
      const diff = Math.abs(edgeA - edgeB)
      if (diff < closestHorizontal) {
        closestHorizontal = diff
        result.horizontal = edgeB
        result.snapPosition.y = node.position.y + (edgeB - edgeA)
      }
    }
  }

  return result
}
