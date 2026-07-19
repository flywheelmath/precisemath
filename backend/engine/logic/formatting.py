import math

def enrich_math_data(raw_data):
    if not raw_data:
        return {}

    data = raw_data.copy()

    slope = data.get('slope')
    basepoint = data.get('basepoint')
    relation = data.get('relation')

    if slope and len(slope) == 2:
        num, den = slope
        if den == 0:
            data['slope_str'] = "\\text{undefined}"
        elif num == 0:
            data['slope_str'] = "0"
        elif den == 1:
            data['slope_str'] = str(num)
        elif den == -1:
            data['slope_str'] = str(-num)
        else:
            sign = "-" if (num * den < 0) else ""
            data['slope_str'] = f"{sign}\\frac{{{abs(num)}}}{{{abs(den)}}}"

    if basepoint and len(basepoint) == 2:
        x0, y0 = basepoint

        if x0 > 0:
            data['x_term'] = f"- {abs(x0)}"
        elif x0 < 0:
            data['x_term'] = f"+ {abs(x0)}"
        else:
            data['x_term'] = ""

        if y0 > 0:
            data['y_term'] = f"+ {abs(y0)}"
        elif y0 < 0:
            data['y_term'] = f"- {abs(y0)}"
        else:
            data['y_term'] = ""

    if relation:
        rel_map = {
            "<=": "\\le",
            ">=": "\\ge",
            "<": "<",
            ">": ">",
            "=": "="
        }
        data['rel_str'] = rel_map.get(relation, relation)

    return data
