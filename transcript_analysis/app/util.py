def convert_numpy_to_python(obj):
    """
    Recursively convert numpy types to Python native types in nested structures.
    
    Args:
        obj: Any object (dict, list, numpy type, or other)
        
    Returns:
        Object with all numpy types converted to Python native types
    """
    if isinstance(obj, dict):
        return {key: convert_numpy_to_python(value) for key, value in obj.items()}
    
    elif isinstance(obj, list):
        return [convert_numpy_to_python(item) for item in obj]
    
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_to_python(item) for item in obj)
    
    elif isinstance(obj, np.ndarray):
        return convert_numpy_to_python(obj.tolist())
    
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    
    elif isinstance(obj, np.bool_):
        return bool(obj)
    
    elif isinstance(obj, np.complexfloating):
        return complex(obj)
    
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    
    else:
        return obj